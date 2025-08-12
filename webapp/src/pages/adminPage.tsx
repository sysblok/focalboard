// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback, useEffect, useMemo, useState} from 'react'

import './adminPage.scss'
import octoClient from '../octoClient'
import {IUser} from '../user'
import Sidebar from '../components/sidebar/sidebar'
import BoardTemplateSelector from '../components/boardTemplateSelector/boardTemplateSelector'
import ChangePasswordDialog from '../components/changePasswordDialog/changePasswordDialog'
import User from '../components/user/user'
import UserSearchForm from '../components/userSearchForm/userSearchForm'

import {useAppSelector} from '../store/hooks'
import {getMe} from '../store/users'
import {getClientConfig} from '../store/clientConfig'
import {ClientConfig} from '../config/clientConfig'

const AdminPage = () => {
    const clientConfig = useAppSelector<ClientConfig>(getClientConfig)
    const me = useAppSelector<IUser|null>(getMe)
    const [users, setUsers] = useState<IUser[]>([])
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [boardTemplateSelectorOpen, setBoardTemplateSelectorOpen] = useState<boolean>(false)
    const [changePasswordUser, setChangePasswordUser] = useState<IUser | null>(null)
    const [errorMessage, setErrorMessage] = useState<{messageId: string, defaultMessage: string} | null>(null)
    const [successMessage, setSuccessMessage] = useState<{messageId: string, defaultMessage: string} | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const fetchUsers = async () => {
        const result = await octoClient.getTeamUsers()
        setUsers(result)
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const filteredUsers = useMemo(() => {
        const arr = searchTerm.trim() ? users.filter((user) => {
            const lower = searchTerm.toLowerCase().trim()
            return (
                user.email?.toLowerCase().includes(lower) ||
                    user.nickname?.toLowerCase().includes(lower) ||
                    user.username?.toLowerCase().includes(lower) ||
                    user.firstname?.toLowerCase().includes(lower) ||
                    user.lastname?.toLowerCase().includes(lower)
            )
        }) : [...users]

        return arr.sort((a, b) =>
            a.username.
                trim().
                toLowerCase().
                localeCompare(b.username.trim().toLowerCase(), 'en', {
                    sensitivity: 'base',
                }),
        )
    }, [users, searchTerm])

    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value)
    }, [])

    const openBoardTemplateSelector = useCallback(() => {
        setBoardTemplateSelectorOpen(true)
    }, [])
    const closeBoardTemplateSelector = useCallback(() => {
        setBoardTemplateSelectorOpen(false)
    }, [])

    const openChangePasswordDialog = useCallback((user: IUser) => {
        setChangePasswordUser(user)
        setErrorMessage(null)
        setSuccessMessage(null)
    }, [])

    const closeChangePasswordDialog = useCallback(() => {
        setErrorMessage(null)
        setSuccessMessage(null)
        setIsSubmitting(false)
        setChangePasswordUser(null)
    }, [])

    const handleChangePassword = useCallback(async (userId: string, newPassword: string) => {
        try {
            const success = await octoClient.changeUserPassword(userId, newPassword)

            if (success) {
                console.log('success')
                setSuccessMessage({
                    messageId: 'change-password.success',
                    defaultMessage: 'Password changed successfully',
                })
                setErrorMessage(null)
            } else {
                setErrorMessage({
                    messageId: 'change-password.failed',
                    defaultMessage: 'Failed to change password. Please try again.',
                })
                setSuccessMessage(null)
            }
        } catch (error) {
            setErrorMessage({
                messageId: 'change-password.error',
                defaultMessage: 'An error occurred while changing password',
            })
            setSuccessMessage(null)
        } finally {
            setIsSubmitting(false)
        }
    }, [closeChangePasswordDialog])

    return (
        <div className='AdminPage'>
            <Sidebar
                onBoardTemplateSelectorOpen={openBoardTemplateSelector}
                onBoardTemplateSelectorClose={closeBoardTemplateSelector}
            />
            <div className='panel'>
                {boardTemplateSelectorOpen &&
                    <BoardTemplateSelector onClose={closeBoardTemplateSelector}/>
                }
                <h1 className='ml-3'>Team Users</h1>
                <UserSearchForm
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    resultsCount={filteredUsers.length}
                    totalCount={users.length}
                />
                {users.length > 0 && (
                    <h2 className='users-count'>
                        {searchTerm ? `Showing ${filteredUsers.length} of ${users.length} users` : `Total users: ${users.length}`
                        }
                    </h2>
                )}
                <ul className='users-list ml-3'>
                    {filteredUsers.map((user) => (
                        <li
                            key={user.id}
                            className='user-item'
                        >
                            <User
                                user={user}
                                teammateNameDisplay={clientConfig.teammateNameDisplay}
                                isMe={me && user.id === me.id}
                                onChangePassword={() => openChangePasswordDialog(user)}
                            />
                        </li>
                    ))}
                </ul>

                {searchTerm && filteredUsers.length === 0 && (
                    <div className='no-results ml-3'>
                        <p>No users found matching "{searchTerm}"</p>
                        <p>Try searching by email, nickname, username, or name.</p>
                    </div>
                )}

                {changePasswordUser && (
                    <ChangePasswordDialog
                        user={changePasswordUser}
                        onClose={closeChangePasswordDialog}
                        onConfirm={handleChangePassword}
                        errorMessage={errorMessage}
                        successMessage={successMessage}
                        isSubmitting={isSubmitting}
                    />
                )}
            </div>
        </div>
    )
}

export default React.memo(AdminPage)
