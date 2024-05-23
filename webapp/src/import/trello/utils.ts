// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {v4 as uuidv4} from 'uuid'

class Utils {
    static createGuid(): string {
        return uuidv4()
    }
}

export {Utils}
