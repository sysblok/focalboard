import React, {useCallback, useEffect} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';

import {IUser} from '../../user';
import {Utils} from '../../utils';

import Button from '../../widgets/buttons/button';
import DeleteIcon from '../../widgets/icons/delete';
import EditIcon from '../../widgets/icons/edit';

import './user.scss'

type Props = {
    user: IUser,
    teammateNameDisplay: string,
    isMe?: boolean | null,
    onChangePassword: () => void;
}

const User = (props: Props) => {

    const {user, teammateNameDisplay, isMe, onChangePassword} = props
    const intl = useIntl()

    return (
        <div className='user'>
            <div className='ml-3'>
                <strong>{Utils.getUserDisplayName(user, teammateNameDisplay)}</strong>
                <strong className='ml-2 text-light'>{`@${user.username}`}</strong>
                {isMe &&
                    <strong className='ml-2 text-light'>{intl.formatMessage({id: 'ShareBoard.userPermissionsYouText', defaultMessage: '(You)'})}</strong>
                }
            </div>
            <div className='actions'>
            <Button
                    emphasis='grey'
                    size='medium'
                    title='Change password'
                    icon={<EditIcon/>}
                    onClick={onChangePassword}
                >
                    <FormattedMessage
                        id='Admin.changePassword'
                        defaultMessage='Change password'
                    />
                </Button>
            <Button
                emphasis='grey'
                size='medium'
                title='Delete user'
                icon={ <DeleteIcon/>}
                onClick={() => {
                    console.log('Not implemented yet')
                }}
            >
                <FormattedMessage
                    id='Admin.deleteUser'
                    defaultMessage='Delete user'
                />
            </Button>
            </div>
        </div>
    );
};

export default React.memo(User)
