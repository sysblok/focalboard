// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
import {Link} from 'react-router-dom'

import Button from '../widgets/buttons/button'
import client from '../octoClient'
import './changeEmailPage.scss'
import {IUser} from '../user'
import {useAppSelector} from '../store/hooks'
import {getMe} from '../store/users'

const ChangeEmailPage = () => {
    const [password, setPassword] = useState('')
    const [newEmail, setNewEmail] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [succeeded, setSucceeded] = useState(false)
    const user = useAppSelector<IUser|null>(getMe)

    if (!user) {
        return (
            <div className='ChangeEmailPage'>
                <div className='title'>{'Change Email'}</div>
                <Link to='/login'>{'Log in first'}</Link>
            </div>
        )
    }

    const handleSubmit = async (userId: string): Promise<void> => {
        const response = await client.changeEmail(userId, password, newEmail)
        if (response.code === 200) {
            setPassword('')
            setNewEmail('')
            setErrorMessage('')
            setSucceeded(true)
        } else {
            setErrorMessage(`Change email failed: ${response.json?.error}`)
        }
    }

    return (
        <div className='ChangeEmailPage'>
            <div className='title'>{'Change Email'}</div>
            <form
                onSubmit={(e: React.FormEvent) => {
                    e.preventDefault()
                    handleSubmit(user.id)
                }}
            >
                <div className='password'>
                    <input
                        id='login-password'
                        type='password'
                        placeholder={'Enter current password'}
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value)
                            setErrorMessage('')
                        }}
                    />
                </div>
                <div className='newEmail'>
                    <input
                        id='login-newemail'
                        type='email'
                        placeholder={'Enter new email'}
                        value={newEmail}
                        onChange={(e) => {
                            setNewEmail(e.target.value)
                            setErrorMessage('')
                        }}
                    />
                </div>
                <Button
                    filled={true}
                    submit={true}
                >
                    {'Change email'}
                </Button>
            </form>
            {errorMessage &&
                <div className='error'>
                    {errorMessage}
                </div>
            }
            {succeeded &&
                <Link
                    className='succeeded'
                    to='/'
                >{'Email changed, click to continue.'}</Link>
            }
            {!succeeded &&
                <Link to='/'>{'Cancel'}</Link>
            }
        </div>
    )
}

export default React.memo(ChangeEmailPage)
