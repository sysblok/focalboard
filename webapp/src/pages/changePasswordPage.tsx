// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
import {Link} from 'react-router-dom'

import Form from '../components/form/form'
import Layout from '../components/layout/layout'
import client from '../octoClient'
import {IUser} from '../user'
import {useAppSelector} from '../store/hooks'
import {getMe} from '../store/users'

const ChangePasswordPage = () => {
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [errorMessage, setErrorMessage] = useState<{messageId: string, defaultMessage: string} | null>(null)
    const [successMessage, setSuccessMessage] = useState<{messageId: string, defaultMessage: string} | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const user = useAppSelector<IUser|null>(getMe)

    if (!user) {
        return (
            <div className='ChangePasswordPage'>
                <div className='title'>{'Change Password'}</div>
                <Link to='/login'>{'Log in first'}</Link>
            </div>
        )
    }

    const handleSubmit = async (): Promise<void> => {
        setIsSubmitting(true)
        setErrorMessage(null)
        setSuccessMessage(null)

        try {
            const response = await client.changePassword(user.id, oldPassword, newPassword)
            if (response.code === 200) {
                setOldPassword('')
                setNewPassword('')
                setSuccessMessage({
                    messageId: 'change-password.success',
                    defaultMessage: 'Password changed'
                })
            } else {
                setErrorMessage({
                    messageId: 'change-password.error',
                    defaultMessage: `Password change failed`
                })
            }
        } catch (error) {
            setErrorMessage({
                messageId: 'change-password.error',
                defaultMessage: `Password change failed`
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleOldPasswordChange = (value: string) => {
        setOldPassword(value)
        setErrorMessage(null)
        setSuccessMessage(null)
    }

    const handleNewPasswordChange = (value: string) => {
        setNewPassword(value)
        setErrorMessage(null)
        setSuccessMessage(null)
    }

    const fields = [
        {
            id: 'login.oldpassword',
            type: 'password',
            placeholder: 'Enter current password',
            value: oldPassword,
            onChange: handleOldPasswordChange
        },
        {
            id: 'login.newpassword',
            type: 'password',
            placeholder: 'Enter new password',
            value: newPassword,
            onChange: handleNewPasswordChange
        }
    ]

    const links = successMessage
        ? [
            {
                to: '/',
                messageId: 'change-password.success-link',
                defaultMessage: 'Click to continue'
            }
        ]
        : [
            {
                to: '/',
                messageId: 'change-password.cancel',
                defaultMessage: 'Cancel'
            }
        ]

    return (
        <Layout>
            <Form
                title={{
                    messageId: 'change-password.title',
                    defaultMessage: 'Change Password'
                }}
                fields={fields}
                submitButton={{
                    messageId: 'change-password.submit',
                    defaultMessage: 'Change password'
                }}
                links={links}
                errorMessage={errorMessage}
                successMessage={successMessage}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
            />
        </Layout>
    )
}

export default React.memo(ChangePasswordPage)
