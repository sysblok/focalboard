// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

class Utils {
    static createGuid(): string {
        // less fancy than with crypto
        const u = Date.now().toString(16)+Math.random().toString(16)+'0'.repeat(16);
        return [u.substring(0,8), u.substring(8,4), '4000-8' + u.substring(13,3), u.substring(16,12)].join('-');
    }
}

export { Utils }
