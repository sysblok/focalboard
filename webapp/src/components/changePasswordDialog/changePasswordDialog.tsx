import React, {useState, useCallback} from 'react'
import {useIntl, FormattedMessage} from 'react-intl'

import Dialog from '../dialog'
import Form from '../form/form'
import {IUser} from '../../user'
import {Utils} from '../../utils'
import './changePasswordDialog.scss'


type Props = {
    user: IUser
    onClose: () => void
    onConfirm: (newPassword: string) => void
}

const ChangePasswordDialog = (props: Props) => {
    const {user, onClose, onConfirm} = props
    const intl = useIntl()
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const username =  Utils.getUserDisplayName(user, 'username')

    const handleSubmit = useCallback(() => {
        setError('')
        setIsSubmitting(true)

        try {
            if (!newPassword.trim()) {
                setError(intl.formatMessage({
                    id: 'ChangePassword.emptyPassword',
                    defaultMessage: 'Password cannot be empty'
                }))
                return
            }

            if (newPassword !== confirmPassword) {
                setError(intl.formatMessage({
                    id: 'ChangePassword.passwordMismatch',
                    defaultMessage: 'Passwords do not match'
                }))
                return
            }

            if (newPassword.length < 6) {
                setError(intl.formatMessage({
                    id: 'ChangePassword.passwordTooShort',
                    defaultMessage: 'Password must be at least 6 characters long'
                }))
                return
            }

            onConfirm(newPassword)
        } catch (err) {
            setError(intl.formatMessage({
                id: 'ChangePassword.error',
                defaultMessage: 'Failed to change password'
            }))
        } finally {
            setIsSubmitting(false)
        }
    }, [newPassword, confirmPassword, onConfirm, intl])

    const dialogTitle = (
        <FormattedMessage
            id='ChangePassword.dialogTitle'
            defaultMessage={'Change user\'s password'}
        />
    )

    const formFields = [
        {
            id: 'new-password',
            type: 'password',
            placeholder: intl.formatMessage({
                id: 'ChangePassword.newPasswordPlaceholder',
                defaultMessage: 'Enter new password'
            }),
            value: newPassword,
            onChange: setNewPassword
        },
        {
            id: 'confirm-password',
            type: 'password',
            placeholder: intl.formatMessage({
                id: 'ChangePassword.confirmPasswordPlaceholder',
                defaultMessage: 'Confirm new password'
            }),
            value: confirmPassword,
            onChange: setConfirmPassword
        }
    ]

    return (
        <Dialog
            title={dialogTitle}
            onClose={onClose}
            size='medium'
            className='change-password-dialog'
        >
            <div className='change-password-content'>
            <p className='text-heading2'>Username: {username}</p>
            <p className='text-heading2'>Email: {user.email}</p>
                <Form
                    title={{
                        messageId: 'ChangePassword.formTitle',
                        defaultMessage: 'Set New Password'
                    }}
                    fields={formFields}
                    submitButton={{
                        messageId: 'ChangePassword.submit',
                        defaultMessage: 'Change Password'
                    }}
                    errorMessage={error}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />
            </div>
        </Dialog>
    )
}

export default React.memo(ChangePasswordDialog)
