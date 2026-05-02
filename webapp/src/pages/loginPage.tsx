import React, {useEffect, useState} from 'react'
import {Redirect, useHistory, useLocation} from 'react-router-dom'

import Form from '../components/form/form'
import Layout from '../components/layout/layout'
import client from '../octoClient'
import {getClientConfig} from '../store/clientConfig'
import {useAppDispatch, useAppSelector} from '../store/hooks'
import {fetchMe, getLoggedIn} from '../store/users'

const LoginPage = () => {
    const dispatch = useAppDispatch()
    const loggedIn = useAppSelector<boolean | null>(getLoggedIn)
    const clientConfig = useAppSelector(getClientConfig)
    const location = useLocation()
    const history = useHistory()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [errorMessage, setErrorMessage] = useState<{messageId: string, defaultMessage: string} | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Handle OIDC callback token/error in query params (both modes can use this)
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const token = params.get('token')
        if (token) {
            localStorage.setItem('focalboardSessionId', token)
            dispatch(fetchMe()).then(() => {
                history.replace('/')
            })
            return
        }

        // Auto-redirect to OIDC provider when in oidc mode and no error
        const error = params.get('error')
        if (!error && clientConfig.authMode === 'oidc') {
            window.location.href = '/api/v2/login/oidc'
        }
    }, [dispatch, history, location.search, clientConfig.authMode])

    if (loggedIn) {
        return <Redirect to='/'/>
    }

    const urlError = new URLSearchParams(location.search).get('error')

    if (clientConfig.authMode === 'oidc') {
        if (urlError) {
            return (
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column'}}>
                    <p style={{color: 'red'}}>{'Login failed. Please try again.'}</p>
                    <a href='/api/v2/login/oidc'>{'Retry'}</a>
                </div>
            )
        }
        return null
    }

    // Native login form
    const handleLogin = async (): Promise<void> => {
        setIsSubmitting(true)
        setErrorMessage(null)
        try {
            const logged = await client.login(username, password)
            if (logged) {
                await dispatch(fetchMe())
                history.push('/')
            } else {
                setErrorMessage({
                    messageId: 'login.incorrect-username-or-password',
                    defaultMessage: 'Incorrect username or password',
                })
            }
        } catch {
            setErrorMessage({
                messageId: 'login.server-error',
                defaultMessage: 'Login failed, please try again',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const formFields = [
        {
            id: 'login-username',
            placeholder: 'Enter username',
            value: username,
            onChange: (value: string) => setUsername(value.trim()),
        },
        {
            id: 'login-password',
            type: 'password',
            placeholder: 'Enter password',
            value: password,
            onChange: setPassword,
        },
    ]

    const formLinks = [
        {
            to: '/register',
            messageId: 'login.register-button',
            defaultMessage: "or create an account if you don't have one",
        },
    ]

    const displayError = urlError
        ? {messageId: 'login.auth-error', defaultMessage: 'Login failed. Please try again.'}
        : errorMessage

    return (
        <Layout>
            <Form
                title={{
                    messageId: 'login.log-in-title',
                    defaultMessage: 'Log in to your account',
                }}
                fields={formFields}
                submitButton={{
                    defaultMessage: 'Log in',
                }}
                links={formLinks}
                errorMessage={displayError}
                onSubmit={handleLogin}
                isSubmitting={isSubmitting}
            />
        </Layout>
    )
}

export default React.memo(LoginPage)
