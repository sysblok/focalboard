// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect} from 'react'
import ReactDOM from 'react-dom'
import {Provider as ReduxProvider} from 'react-redux'
import {store as emojiMartStore} from 'emoji-mart'

import App from './app'
import {initThemes} from './theme'
import {importNativeAppSettings} from './nativeApp'
import {UserSettings} from './userSettings'

import {IUser} from './user'
import {getMe} from './store/users'
import {useAppSelector} from './store/hooks'
import { isProduction } from './config/envConfig'

import '@mattermost/compass-icons/css/compass-icons.css'

import './styles/variables.scss'
import './styles/main.scss'
import './styles/labels.scss'
import './styles/_markdown.scss'

import store from './store'
import WithWebSockets from './components/withWebSockets'

emojiMartStore.setHandlers({getter: UserSettings.getEmojiMartSetting, setter: UserSettings.setEmojiMartSetting})
importNativeAppSettings()

initThemes()

const MainApp = () => {
    const me = useAppSelector<IUser|null>(getMe)

    if (!isProduction) {
        document.documentElement.style.setProperty('--sidebar-bg-rgb', '92, 50, 30')
    } else {
        document.documentElement.style.setProperty('--sidebar-bg-rgb', '30, 50, 92')
    }

    return (
        <WithWebSockets userId={me?.id}>
            <App/>
        </WithWebSockets>
    )
}

ReactDOM.render(
    (
        <ReduxProvider store={store}>
            <MainApp/>
        </ReduxProvider>
    ),
    document.getElementById('focalboard-app'),
)
