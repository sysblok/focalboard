// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useRef} from 'react'
import {DropTargetMonitor, useDrop} from 'react-dnd'

import {Card} from '../../blocks/card'
import {IPropertyOption} from '../../blocks/board'
import './kanbanColumn.scss'

type Props = {
    onDropCard: (card: Card) => void
    onDropHeader: (option: IPropertyOption, monitor: DropTargetMonitor, ref: React.RefObject<HTMLDivElement>) => void
    children: React.ReactNode
}

const KanbanColumn = (props: Props) => {
    const columnRef = useRef<HTMLDivElement>(null);
    const [{isOver}, drop] = useDrop(() => ({
        accept: ['card', 'column'],
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
        drop: (item: {content: Card, type: 'card'} | {content: IPropertyOption, type: 'column'}, monitor) => {
            if (monitor.isOver({shallow: true})) {
                if (item.type === 'card') {
                    props.onDropCard(item.content);
                } else if (item.type === 'column') {
                    props.onDropHeader(item.content as IPropertyOption, monitor, columnRef);
                }
            }
        },
    }), [props.onDropCard, props.onDropHeader])

    drop(columnRef);

    let className = 'octo-board-column'
    if (isOver) {
        className += ' dragover'
    }
    return (
        <div
            ref={columnRef}
            className={className}
        >
            {props.children}
        </div>
    )
}

export default React.memo(KanbanColumn)
