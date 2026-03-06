import React, {useRef} from 'react'
import {useIntl} from 'react-intl'

import {Board} from '../../blocks/board'
import IconButton from '../../widgets/buttons/iconButton'
import OptionsIcon from '../../widgets/icons/options'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import CompassIcon from '../../widgets/icons/compassIcon'
import {Archiver} from '../../archiver'

type Props = {
    board: Board
}

const SidebarBoardItemReadOnly = (props: Props) => {
    const intl = useIntl()
    const board = props.board
    const boardItemRef = useRef<HTMLDivElement>(null)

    const title = board.title || intl.formatMessage({id: 'Sidebar.untitled-board', defaultMessage: '(Untitled Board)'})

    return (
        <div
            className='SidebarBoardItem subitem'
            ref={boardItemRef}
        >
            <div className='octo-sidebar-icon'>
                {board.icon || <CompassIcon icon='product-boards'/>}
            </div>
            <div
                className='octo-sidebar-title'
                title={title}
            >
                {title}
            </div>
            <div>
                <MenuWrapper stopPropagationOnToggle={true}>
                    <IconButton icon={<OptionsIcon/>}/>
                    <Menu
                        fixed={true}
                        position='auto'
                        parentRef={boardItemRef}
                    >
                        <Menu.Text
                            id='exportBoardArchive'
                            name={intl.formatMessage({id: 'ViewHeader.export-board-archive', defaultMessage: 'Export board archive'})}
                            icon={<CompassIcon icon='export-variant'/>}
                            onClick={() => Archiver.exportBoardArchive(board)}
                        />
                    </Menu>
                </MenuWrapper>
            </div>
        </div>
    )
}

export default React.memo(SidebarBoardItemReadOnly)
