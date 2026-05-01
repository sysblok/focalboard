import React, {useEffect} from 'react'
import {Redirect, useHistory, useLocation} from 'react-router-dom'

import {useAppDispatch, useAppSelector} from '../store/hooks'
import {fetchMe, getLoggedIn} from '../store/users'

const LoginPage = () => {
    const dispatch = useAppDispatch()
    const loggedIn = useAppSelector<boolean | null>(getLoggedIn)
    const location = useLocation()
    const history = useHistory()

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

        const error = params.get('error')
        if (!error) {
            window.location.href = '/api/v2/login/oidc'
        }
    }, [dispatch, history, location.search])

    if (loggedIn) {
        return <Redirect to='/'/>
    }

    const error = new URLSearchParams(location.search).get('error')
    if (error) {
        return (
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
                <p style={{color: 'red'}}>{'Login failed. Please try again.'}</p>
                <br/>
                <a href='/api/v2/login/oidc'>{'Retry'}</a>
            </div>
        )
    }

    return null
}

export default React.memo(LoginPage)
