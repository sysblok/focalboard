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
    onConfirm: (userId: string, newPassword: string) => void
    errorMessage?: {
        messageId: string
        defaultMessage: string
    } | null
    successMessage?: {
        messageId: string
        defaultMessage: string
    } | null
    isSubmitting?: boolean
}

const changePasswordDialog = (props: Props) => {
    const {user, onClose, onConfirm, errorMessage, successMessage, isSubmitting = false} = props
    const intl = useIntl()
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [localError, setLocalError] = useState<{messageId: string, defaultMessage: string} | null>(null)
    const username =  Utils.getUserDisplayName(user, 'username')

    const handleSubmit = useCallback(() => {

        setLocalError(null)

        if (!newPassword.trim()) {
            setLocalError({
                messageId: 'change-password.error-empty',
                defaultMessage: 'Password cannot be empty'
            })
            return
        }

        if (newPassword !== confirmPassword) {
            setLocalError({
                messageId: 'change-password.error-mismatch',
                defaultMessage: 'Passwords do not match'
            })
            return
        }

        if (newPassword.length < 6) {
            setLocalError({
                messageId: 'change-password.error-too-short',
                defaultMessage: 'Password must be at least 6 characters long'
            })
            return
        }

        onConfirm(user.id, newPassword)
    }, [newPassword, confirmPassword, onConfirm, intl])

    const dialogTitle = (
        <FormattedMessage
            id='change-password.dialog-title'
            defaultMessage={'Change user\'s password'}
        />
    )

    const formFields = [
        {
            id: 'new-password',
            type: 'password',
            placeholder: intl.formatMessage({
                id: 'change-password.placeholder',
                defaultMessage: 'Enter new password'
            }),
            value: newPassword,
            onChange: setNewPassword
        },
        {
            id: 'confirm-password',
            type: 'password',
            placeholder: intl.formatMessage({
                id: 'change-password.confirm-placeholder',
                defaultMessage: 'Confirm new password'
            }),
            value: confirmPassword,
            onChange: setConfirmPassword
        }
    ]

    const displayErrorMessage = localError || errorMessage
    const displaySuccessMessage = localError ? null : successMessage

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
                        messageId: 'change-password.title',
                        defaultMessage: 'Set New Password'
                    }}
                    fields={formFields}
                    submitButton={{
                        messageId: 'change-password.submit',
                        defaultMessage: 'Change Password'
                    }}
                    errorMessage={displayErrorMessage}
                    successMessage={displaySuccessMessage}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />
            </div>
        </Dialog>
    )
}

export default React.memo(changePasswordDialog)
