import React from 'react'

interface FormInputProps {
    id: string
    type?: string
    placeholder: string
    value: string
    onChange: (value: string) => void
    disabled?: boolean
    className?: string
}

const FormInput: React.FC<FormInputProps> = ({
    id,
    type = 'text',
    placeholder,
    value,
    onChange,
    disabled = false,
    className = ''
}) => {
    // Determine the field type based on id or type prop
    const getFieldType = () => {
        if (type !== 'text') return type
        if (id.includes('password')) return 'password'
        if (id.includes('email')) return 'email'
        return 'text'
    }

    // Get CSS class name based on field type
    const getFieldClassName = () => {
        if (id.includes('email')) return 'email'
        if (id.includes('username')) return 'username'
        if (id.includes('password')) return 'password'
        return 'field'
    }

    return (
        <div className={`${getFieldClassName()} ${className}`}>
            <input
                id={id}
                type={getFieldType()}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
            />
        </div>
    )
}

export default FormInput
