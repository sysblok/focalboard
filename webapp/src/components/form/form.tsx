import React from 'react'
import { Link } from 'react-router-dom'
import { FormattedMessage } from 'react-intl'
import Button from '../../widgets/buttons/button'
import FormInput from '../formInput/formInput'
import './form.scss'

interface FormField {
    id: string
    type?: string
    placeholder: string
    value: string
    onChange: (value: string) => void
}

interface FormLink {
    to: string
    messageId: string
    defaultMessage: string
}

interface FormProps {
    className?: string
    title: {
        messageId: string
        defaultMessage: string
    }
    fields: FormField[]
    submitButton: {
        messageId?: string
        defaultMessage: string
    }
    links?: FormLink[]
    errorMessage?: {
        messageId: string
        defaultMessage: string
    } | null
    successMessage?: {
        messageId: string
        defaultMessage: string
    } | null
    onSubmit: () => void
    isSubmitting?: boolean
}

const Form: React.FC<FormProps> = ({
    className = '',
    title,
    fields,
    submitButton,
    links = [],
    errorMessage,
    successMessage,
    onSubmit,
    isSubmitting = false
}) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit()
    }

    return (
        <div className={`Form ${className}`}>
            <form onSubmit={handleSubmit}>
                <div className='title'>
                    <FormattedMessage
                        id={title.messageId}
                        defaultMessage={title.defaultMessage}
                    />
                </div>

                {fields.map((field) => (
                    <FormInput
                        key={field.id}
                        id={field.id}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                    />
                ))}

                <Button
                    filled={true}
                    submit={true}
                    disabled={isSubmitting}
                >
                    {submitButton.messageId ? (
                        <FormattedMessage
                            id={submitButton.messageId}
                            defaultMessage={submitButton.defaultMessage}
                        />
                    ) : (
                        submitButton.defaultMessage
                    )}
                </Button>
            </form>

            <div className='message-container'>
                {errorMessage && (
                    <div className='error'>
                        <FormattedMessage
                            id={errorMessage.messageId}
                            defaultMessage={errorMessage.defaultMessage}
                        />
                    </div>
                )}
                {successMessage && (
                    <div className='success'>
                        <FormattedMessage
                            id={successMessage.messageId}
                            defaultMessage={successMessage.defaultMessage}
                        />
                    </div>


                )}
            </div>

            <div className='links-container'>
                {links.map((link, index) => (
                    <Link key={index} to={link.to}>
                        <FormattedMessage
                            id={link.messageId}
                            defaultMessage={link.defaultMessage}
                        />
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default Form
