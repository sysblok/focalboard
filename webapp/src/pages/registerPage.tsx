// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
import {useHistory, Redirect} from 'react-router-dom'

import Form from '../components/form/form'
import {useAppDispatch, useAppSelector} from '../store/hooks'
import {fetchMe, getLoggedIn} from '../store/users'

import client from '../octoClient'

const RegisterPage = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [email, setEmail] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const history = useHistory()
    const dispatch = useAppDispatch()
    const loggedIn = useAppSelector<boolean|null>(getLoggedIn)

    const handleRegister = async (): Promise<void> => {
        setIsSubmitting(true)
        setErrorMessage('')

        try {
            const queryString = new URLSearchParams(window.location.search)
            const signupToken = queryString.get('t') || ''

            const response = await client.register(email, username, password, signupToken)
            if (response.code === 200) {
                const logged = await client.login(username, password)
                if (logged) {
                    await dispatch(fetchMe())
                    history.push('/')
                }
            } else if (response.code === 401) {
                setErrorMessage('Invalid registration link, please contact your administrator')
            } else {
                setErrorMessage(`${response.json?.error}`)
            }
        } catch (error) {
            setErrorMessage('Registration failed')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loggedIn) {
        return <Redirect to={'/'}/>
    }

    const formFields = [
        {
            id: 'register-email',
            placeholder: 'Enter email',
            value: email,
            onChange: (value: string) => setEmail(value.trim())
        },
        {
            id: 'register-username',
            placeholder: 'Enter username',
            value: username,
            onChange: (value: string) => setUsername(value.trim())
        },
        {
            id: 'register-password',
            type: 'password',
            placeholder: 'Enter password',
            value: password,
            onChange: setPassword
        }
    ]

    const formLinks = [
        {
            to: '/login',
            messageId: 'register.login-button',
            defaultMessage: 'or log in if you already have an account'
        }
    ]

    return (
        <Form
            className="RegisterPage"
            title={{
                messageId: 'register.signup-title',
                defaultMessage: 'Sign up for your account'
            }}
            fields={formFields}
            submitButton={{
                defaultMessage: 'Register'
            }}
            links={formLinks}
            errorMessage={errorMessage}
            onSubmit={handleRegister}
            isSubmitting={isSubmitting}
        />
    )
}

export default React.memo(RegisterPage)
