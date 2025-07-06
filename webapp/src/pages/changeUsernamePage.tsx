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

const ChangeUsernamePage = () => {
    const [password, setPassword] = useState('')
    const [newUsername, setNewUsername] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const user = useAppSelector<IUser|null>(getMe)

    if (!user) {
        return (
            <div className='ChangeUsernamePage'>
                <div className='title'>{'Change Username'}</div>
                <Link to='/login'>{'Log in first'}</Link>
            </div>
        )
    }

    const handleSubmit = async (): Promise<void> => {
        setIsSubmitting(true)
        setErrorMessage('')
        setSuccessMessage('')

        try {
            const response = await client.changeUsername(user.id, password, newUsername)
            if (response.code === 200) {
                setPassword('')
                setNewUsername('')
                setSuccessMessage('Username changed')
            } else {
                setErrorMessage(`Change username failed: ${response.json?.error}`)
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

    const handleUsernameChange = (value: string) => {
        setNewUsername(value)
        setErrorMessage('')
        setSuccessMessage('')
    }

    const fields = [
        {
            id: 'login.password',
            type: 'password',
            placeholder: 'Enter current password',
            value: password,
            onChange: handlePasswordChange
        },
        {
            id: 'login.newusername',
            type: 'text',
            placeholder: 'Enter new username',
            value: newUsername,
            onChange: handleUsernameChange
        }
    ]

    const links = successMessage
        ? [
            {
                to: '/',
                messageId: 'change-username.success-link',
                defaultMessage: 'Click to continue'
            }
        ]
        : [
            {
                to: '/',
                messageId: 'change-username.cancel',
                defaultMessage: 'Cancel'
            }
        ]

    return (
        <Layout>
            <Form
                title={{
                    messageId: 'change-username.title',
                    defaultMessage: 'Change Username'
                }}
                fields={fields}
                submitButton={{
                    messageId: 'change-username.submit',
                    defaultMessage: 'Change username'
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

export default React.memo(ChangeUsernamePage)
