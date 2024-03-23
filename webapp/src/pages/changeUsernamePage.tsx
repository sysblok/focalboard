// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
import {Link} from 'react-router-dom'

import Button from '../widgets/buttons/button'
import client from '../octoClient'
import './changeUsernamePage.scss'
import {IUser} from '../user'
import {useAppSelector} from '../store/hooks'
import {getMe} from '../store/users'

const ChangeUsernamePage = () => {
    const [password, setPassword] = useState('')
    const [newUsername, setNewUsername] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [succeeded, setSucceeded] = useState(false)
    const user = useAppSelector<IUser|null>(getMe)

    if (!user) {
        return (
            <div className='ChangeUsernamePage'>
                <div className='title'>{'Change Username'}</div>
                <Link to='/login'>{'Log in first'}</Link>
            </div>
        )
    }

    const handleSubmit = async (userId: string): Promise<void> => {
        const response = await client.changeUsername(userId, password, newUsername)
        if (response.code === 200) {
            setPassword('')
            setNewUsername('')
            setErrorMessage('')
            setSucceeded(true)
        } else {
            setErrorMessage(`Change username failed: ${response.json?.error}`)
        }
    }

    return (
        <div className='ChangeUsernamePage'>
            <div className='title'>{'Change Username'}</div>
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
                <div className='newUsername'>
                    <input
                        id='login-newusername'
                        type='username'
                        placeholder={'Enter new username'}
                        value={newUsername}
                        onChange={(e) => {
                            setNewUsername(e.target.value)
                            setErrorMessage('')
                        }}
                    />
                </div>
                <Button
                    filled={true}
                    submit={true}
                >
                    {'Change username'}
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
                >{'Username changed, click to continue.'}</Link>
            }
            {!succeeded &&
                <Link to='/'>{'Cancel'}</Link>
            }
        </div>
    )
}

export default React.memo(ChangeUsernamePage)
