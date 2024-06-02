// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
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
import {getClientConfig} from './store/clientConfig'

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
    const clientConfig = useAppSelector(getClientConfig)

    if (clientConfig.featureFlags['FOCALBOARD_ENVIRONMENT'] != 'prod') {
        // TODO also set this when changing a theme
        // for some reason useAppSelector doesn't work in theme.ts
        document.documentElement.style.setProperty('--sidebar-bg-rgb', '92, 50, 30')
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
