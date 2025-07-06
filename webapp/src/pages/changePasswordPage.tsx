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
    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
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
        setErrorMessage('')
        setSuccessMessage('')

        try {
            const response = await client.changePassword(user.id, oldPassword, newPassword)
            if (response.code === 200) {
                setOldPassword('')
                setNewPassword('')
                setSuccessMessage('Password changed')
            } else {
                setErrorMessage(`Change password failed: ${response.json?.error}`)
            }
        } catch (error) {
            setErrorMessage('An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleOldPasswordChange = (value: string) => {
        setOldPassword(value)
        setErrorMessage('')
        setSuccessMessage('')
    }

    const handleNewPasswordChange = (value: string) => {
        setNewPassword(value)
        setErrorMessage('')
        setSuccessMessage('')
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
