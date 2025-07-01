// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
import {Redirect, useHistory, useLocation} from 'react-router-dom'

import Form from '../components/form/form'
import {useAppDispatch, useAppSelector} from '../store/hooks'
import {fetchMe, getLoggedIn} from '../store/users'
import client from '../octoClient'

const LoginPage = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const dispatch = useAppDispatch()
    const loggedIn = useAppSelector<boolean|null>(getLoggedIn)
    const queryParams = new URLSearchParams(useLocation().search)
    const history = useHistory()

    const handleLogin = async (): Promise<void> => {
        setIsSubmitting(true)
        setErrorMessage('')

        try {
            const logged = await client.login(username, password)
            if (logged) {
                await dispatch(fetchMe())
                const redirectTo = queryParams.get('r') || '/'
                history.push(redirectTo)
            } else {
                setErrorMessage('Login failed')
            }
        } catch (error) {
            setErrorMessage('Login failed')
        } finally {
            setIsSubmitting(false)
        }
    }

    const clearErrorOnChange = (value: string, setter: (value: string) => void) => {
        setter(value)
        if (errorMessage) {
            setErrorMessage('')
        }
    }

    if (loggedIn) {
        return <Redirect to={'/'}/>
    }

    const formFields = [
        {
            id: 'login-username',
            placeholder: 'Enter username',
            value: username,
            onChange: (value: string) => clearErrorOnChange(value, setUsername)
        },
        {
            id: 'login-password',
            type: 'password',
            placeholder: 'Enter password',
            value: password,
            onChange: (value: string) => clearErrorOnChange(value, setPassword)
        }
    ]

    const formLinks = [
        {
            to: '/register',
            messageId: 'login.register-button',
            defaultMessage: 'or create an account if you don\'t have one'
        },
        {
            to: '/reset',
            messageId: 'login.reset-button',
            defaultMessage: 'Forgot password?'
        }
    ]

    return (
        <Form
            className="LoginPage"
            title={{
                messageId: 'login.log-in-title',
                defaultMessage: 'Log in'
            }}
            fields={formFields}
            submitButton={{
                messageId: 'login.log-in-button',
                defaultMessage: 'Log in'
            }}
            links={formLinks}
            errorMessage={errorMessage}
            onSubmit={handleLogin}
            isSubmitting={isSubmitting}
        />
    )
}

export default React.memo(LoginPage)
