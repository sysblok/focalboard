// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
import {Link} from 'react-router-dom'

import Form from '../components/form/form'
import client from '../octoClient'
import {IUser} from '../user'
import {useAppSelector} from '../store/hooks'
import {getMe} from '../store/users'

const ChangeEmailPage = () => {
    const [password, setPassword] = useState('')
    const [newEmail, setNewEmail] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const user = useAppSelector<IUser|null>(getMe)

    if (!user) {
        return (
            <div className='ChangeEmailPage'>
                <div className='title'>{'Change Email'}</div>
                <Link to='/login'>{'Log in first'}</Link>
            </div>
        )
    }

    const handleSubmit = async (): Promise<void> => {
        setIsSubmitting(true)
        setErrorMessage('')
        setSuccessMessage('')

        try {
            const response = await client.changeEmail(user.id, password, newEmail)
            if (response.code === 200) {
                setPassword('')
                setNewEmail('')
                setSuccessMessage('Email changed')
            } else {
                setErrorMessage(`Change email failed: ${response.json?.error}`)
            }
        } catch (error) {
            setErrorMessage('An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handlePasswordChange = (value: string) => {
        setPassword(value)
        setErrorMessage('')
        setSuccessMessage('')
    }

    const handleEmailChange = (value: string) => {
        setNewEmail(value)
        setErrorMessage('')
        setSuccessMessage('')
    }

    const fields = [
        {
            id: 'login-password',
            type: 'password',
            placeholder: 'Enter current password',
            value: password,
            onChange: handlePasswordChange
        },
        {
            id: 'login-newemail',
            type: 'email',
            placeholder: 'Enter new email',
            value: newEmail,
            onChange: handleEmailChange
        }
    ]

    const links = successMessage
        ? [
            {
                to: '/',
                messageId: 'change-email.success-link',
                defaultMessage: 'Click to continue.'
            }
        ]
        : [
            {
                to: '/',
                messageId: 'change-email.cancel',
                defaultMessage: 'Cancel'
            }
        ]

    return (
        <div className='ChangeEmailPage'>
            <Form
                title={{
                    messageId: 'change-email.title',
                    defaultMessage: 'Change Email'
                }}
                fields={fields}
                submitButton={{
                    messageId: 'change-email.submit',
                    defaultMessage: 'Change email'
                }}
                links={links}
                errorMessage={errorMessage}
                successMessage={successMessage}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
            />
        </div>
    )
}

export default React.memo(ChangeEmailPage)
