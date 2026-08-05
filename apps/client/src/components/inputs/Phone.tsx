import ReactPhoneInput from 'react-phone-input-2';
import pt from 'react-phone-input-2/lang/pt.json';
import { twMerge } from 'tailwind-merge';

interface PhoneInputProps {
	id?: string;
	name?: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	autoComplete?: string;
	required?: boolean;
	disabled?: boolean;
	invalid?: boolean;
	className?: string;
}

const PhoneInputElement =
	(ReactPhoneInput as unknown as { default?: typeof ReactPhoneInput }).default || ReactPhoneInput;

export const PhoneInput: React.FC<PhoneInputProps> = ({
	id,
	name,
	value,
	onChange,
	placeholder,
	autoComplete = 'tel',
	required,
	disabled,
	invalid,
	className
}) => (
	<PhoneInputElement
		country="br"
		preferredCountries={['br', 'pt', 'us', 'ar']}
		value={value}
		onChange={phoneNumber => onChange(phoneNumber)}
		placeholder={placeholder}
		disabled={disabled}
		countryCodeEditable={false}
		enableSearch
		disableSearchIcon
		localization={pt}
		searchPlaceholder="Buscar país..."
		searchNotFound="Nenhum país encontrado"
		specialLabel=""
		containerClass={twMerge('contact-phone-input mt-1.5', invalid && 'is-invalid', className)}
		inputClass="contact-phone-input__field"
		buttonClass="contact-phone-input__button"
		dropdownClass="contact-phone-input__dropdown"
		searchClass="contact-phone-input__search"
		inputProps={{
			id,
			name,
			required,
			autoComplete,
			'aria-invalid': invalid || undefined
		}}
	/>
);
