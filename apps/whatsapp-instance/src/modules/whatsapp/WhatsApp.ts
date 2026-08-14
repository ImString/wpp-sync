import { Boom } from '@hapi/boom';
import { BaseModule, type Core } from '@wppsync/backend';
import { Terminal } from '@wppsync/shared';
import {
	WhatsAppEventTopic,
	type WhatsAppConnectionStatus,
	type WhatsAppConnectionUpdatedData,
	type WhatsAppQrUpdatedData
} from '@wppsync/whatsapp-contracts';
import makeWASocket, {
	DisconnectReason,
	makeCacheableSignalKeyStore,
	useMultiFileAuthState,
	type ConnectionState,
	type WAMessage
} from 'baileys';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import P from 'pino';

import { environment } from '@/config/index.js';
import { KafkaModule, type KafkaModuleBase } from '@/modules/kafka/index.js';

export class WhatsAppModuleBase extends BaseModule {
	instance?: ReturnType<typeof makeWASocket>;
	status: WhatsAppConnectionStatus = 'starting';
	qr?: string;

	private reconnectTimer?: NodeJS.Timeout;
	private shuttingDown = false;

	constructor(private readonly kafka: KafkaModuleBase = KafkaModule) {
		super({ dependencies: [kafka] });
	}

	async init(core: Core): Promise<void> {
		core.providers.registerInstance(WhatsAppModuleBase, this);
		await this.connect();
	}

	private async connect(): Promise<void> {
		const authDirectory = path.join(environment.dataDirectory, 'auth');
		await mkdir(authDirectory, { recursive: true });

		const { state, saveCreds } = await useMultiFileAuthState(authDirectory);
		this.status = 'starting';

		this.instance = makeWASocket({
			auth: {
				creds: state.creds,
				keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' }))
			},
			logger: P({ level: 'silent' }),
			printQRInTerminal: false,
			connectTimeoutMs: 30_000,
			keepAliveIntervalMs: 30_000,
			qrTimeout: 45_000,
			maxMsgRetryCount: 4,
			retryRequestDelayMs: 350,
			generateHighQualityLinkPreview: true
		});

		this.instance.ev.on('creds.update', saveCreds);
		this.instance.ev.on('connection.update', update => {
			void this.onConnectionUpdate(update).catch(error => {
				Terminal.error('WHATSAPP', error instanceof Error ? error.message : String(error));
			});
		});
		this.instance.ev.on('messages.upsert', event => {
			void this.onMessages(event.messages).catch(error => {
				Terminal.error('WHATSAPP', error instanceof Error ? error.message : String(error));
			});
		});
		this.instance.ev.on('messages.update', updates => {
			void this.kafka.publish(WhatsAppEventTopic.MESSAGE_ACKNOWLEDGED, { updates }).catch(error => {
				Terminal.error('KAFKA', error instanceof Error ? error.message : String(error));
			});
		});

		Terminal.success('WHATSAPP', 'Client initialized.');
	}

	private async onConnectionUpdate(update: Partial<ConnectionState>): Promise<void> {
		if (update.qr) {
			this.status = 'awaiting_qr';
			this.qr = update.qr;
			await this.kafka.publish<WhatsAppQrUpdatedData>(WhatsAppEventTopic.QR_UPDATED, { qr: update.qr });
			await this.kafka.publish<WhatsAppConnectionUpdatedData>(
				WhatsAppEventTopic.CONNECTION_UPDATED,
				{ status: this.status }
			);
		}

		if (!update.connection) return;

		const reason = update.lastDisconnect?.error
			? new Boom(update.lastDisconnect.error).output.statusCode
			: undefined;

		if (update.connection === 'open') {
			this.status = 'connected';
			this.qr = undefined;
		} else if (reason === DisconnectReason.loggedOut) {
			this.status = 'logged_out';
		} else if (update.connection === 'close') {
			this.status = 'disconnected';
		}

		const event: WhatsAppConnectionUpdatedData = {
			status: this.status,
			...(reason !== undefined && { reason }),
			...(update.lastDisconnect?.error instanceof Error && {
				message: update.lastDisconnect.error.message
			})
		};

		await this.kafka.publish(WhatsAppEventTopic.CONNECTION_UPDATED, event);

		if (
			update.connection === 'close' &&
			reason !== DisconnectReason.loggedOut &&
			!this.shuttingDown
		) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = setTimeout(() => void this.connect(), 1_500);
		}
	}

	private async onMessages(messages: WAMessage[]): Promise<void> {
		for (const message of messages) {
			if (!message.message || message.key.remoteJid === 'status@broadcast') continue;

			await this.kafka.publish(WhatsAppEventTopic.MESSAGE_RECEIVED, {
				key: message.key,
				pushName: message.pushName,
				message: message.message,
				messageTimestamp: message.messageTimestamp
			});
		}
	}

	async sendText(phone: string, message: string) {
		if (!this.instance || this.status !== 'connected') {
			throw new Error('WhatsApp is not connected.');
		}

		const normalized = phone.replace(/\D/g, '');
		const jid = phone.includes('@') ? phone : `${normalized}@s.whatsapp.net`;
		const [contact] = (await this.instance.onWhatsApp(jid)) ?? [];

		if (!contact?.exists) throw new Error('Phone number is not available on WhatsApp.');

		return this.instance.sendMessage(contact.jid, { text: message });
	}

	async logout(): Promise<void> {
		await this.instance?.logout();
		this.status = 'logged_out';
		this.qr = undefined;
	}

	async shutdown(): Promise<void> {
		this.shuttingDown = true;
		clearTimeout(this.reconnectTimer);
		this.instance?.end(new Error('Application shutdown'));
		this.instance = undefined;
	}
}

export const WhatsAppModule = new WhatsAppModuleBase();
