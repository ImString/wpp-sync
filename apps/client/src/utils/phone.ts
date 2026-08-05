import parsePhoneNumberFromString, { parseIncompletePhoneNumber } from 'libphonenumber-js';

export { parsePhoneNumberFromString, parseIncompletePhoneNumber } from 'libphonenumber-js';

const toInternationalPhone = (phoneNumber: string) => {
	const incompletePhone = parseIncompletePhoneNumber(phoneNumber);

	if (!incompletePhone) return phoneNumber;
	if (incompletePhone.startsWith('+')) return incompletePhone;

	const digits = incompletePhone.replace(/\D/g, '');
	return `+${digits}`;
};

export const isPossiblePhone = (phoneNumber: string): boolean =>
	parsePhoneNumberFromString(toInternationalPhone(phoneNumber))?.isPossible() || false;

export const formatNationalPhone = (phoneNumber: string): string => {
	const numberPhone = parsePhoneNumberFromString(toInternationalPhone(phoneNumber));

	if (!numberPhone?.isPossible()) return '';
	if (numberPhone.country !== 'BR') return numberPhone.formatInternational();

	const nationalNumber = numberPhone.nationalNumber;

	if (nationalNumber.length === 10 && nationalNumber[2] >= '6') {
		const fixedNumber = nationalNumber.slice(0, 2) + '9' + nationalNumber.slice(2);

		return parsePhoneNumberFromString(`+55${fixedNumber}`)?.formatNational() || '';
	}

	return numberPhone.formatNational();
};
