// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Block} from '../../blocks/block'
import {Board} from '../../blocks/board'
import {IPropertyOption, IPropertyTemplate, createBoard} from '../../blocks/board'
import {createBoardView} from '../../blocks/boardView'
import {createCard} from '../../blocks/card'
import {createTextBlock} from '../../blocks/textBlock'
import {createCheckboxBlock} from '../../blocks/checkboxBlock'
import {Trello} from './trello'
import {Utils} from './utils'

// HACKHACK: To allow Utils.CreateGuid to work
// (global.window as any) = {}

const optionColors = [
    // 'propColorDefault',
    'propColorGray',
    'propColorBrown',
    'propColorOrange',
    'propColorYellow',
    'propColorGreen',
    'propColorBlue',
    'propColorPurple',
    'propColorPink',
    'propColorRed',
]
let optionColorIndex = 0

export function convertTrello(input: Trello, memberIdMap: Map<string, string>): [Board[], Block[]] {
    const boards: Board[] = []
    const blocks: Block[] = []

    // Board
    const board = createBoard()
    console.log(`Board: ${input.name}`)
    board.title = input.name
    board.description = input.desc

    // Convert lists (columns) to a Select property
    const optionIdMap = new Map<string, string>()
    const options: IPropertyOption[] = []
    input.lists.filter(
        // don't import archived lists, they have misaligned positions
        // TODO move into optional flag
        (list) => list.closed == false
    ).forEach(list => {
        const optionId = Utils.createGuid()
        optionIdMap.set(list.id, optionId)
        const color = optionColors[optionColorIndex % optionColors.length]
        optionColorIndex += 1
        const option: IPropertyOption = {
            id: optionId,
            value: list.name,
            color,
        }
        options.push(option)
    })

    const cardProperty: IPropertyTemplate = {
        id: Utils.createGuid(),
        name: 'List',
        type: 'select',
        options
    }
    const memberProperty: IPropertyTemplate = {
        id: Utils.createGuid(),
        name: 'Assignee',
        type: 'multiPerson',
        options: []
    }
    board.cardProperties = [cardProperty, memberProperty]
    boards.push(board)

    // Board view
    const view = createBoardView()
    view.title = 'Board View'
    view.fields.viewType = 'board'
    view.boardId = board.id
    view.parentId = board.id
    blocks.push(view)

    // Cards
    input.cards.filter(
        // don't import archived cards
        // TODO move into optional flag
        (card) => card.closed == false
    ).forEach(card => {
        // console.log(`Card: ${card.name}`)

        const outCard = createCard()
        outCard.title = card.name
        outCard.boardId = board.id
        outCard.parentId = board.id

        // Map lists to Select property options
        if (card.idList) {
            const optionId = optionIdMap.get(card.idList)
            if (optionId) {
                outCard.fields.properties[cardProperty.id] = optionId
            } else {
                console.warn(`Invalid idList: ${card.idList} for card: ${card.name}`)
            }
        } else {
            console.warn(`Missing idList for card: ${card.name}`)
        }

        blocks.push(outCard)

        if (card.desc) {
            // console.log(`\t${card.desc}`)
            const text = createTextBlock()
            text.title = card.desc
            text.boardId = board.id
            text.parentId = outCard.id
            blocks.push(text)

            outCard.fields.contentOrder = [text.id]
        }

        // Add assignees
        if (card.idMembers && card.idMembers.length > 0) {
            card.idMembers.forEach(idMember => {
                let focalboardId = memberIdMap.get(idMember.toString())
                if (focalboardId) {
                    if (outCard.fields.properties[memberProperty.id]) {
                        outCard.fields.properties[memberProperty.id] = [...outCard.fields.properties[memberProperty.id], focalboardId]
                    } else {
                        outCard.fields.properties[memberProperty.id] = [focalboardId]
                    }
                } else {
                    console.warn(`Not found card member for: ${card.idList} for card: ${card.name}`)
                }
            })
        }

        // Add Checklists
        if (card.idChecklists && card.idChecklists.length > 0) {
            card.idChecklists.forEach(checklistID => {
                const lookup = input.checklists.find(e => e.id === checklistID)
                if (lookup) {
                    lookup.checkItems.forEach(trelloCheckBox=> {
                        const checkBlock = createCheckboxBlock()
                        checkBlock.title = trelloCheckBox.name
                        if (trelloCheckBox.state === 'complete') {
                            checkBlock.fields.value = true
                        } else {
                            checkBlock.fields.value = false
                        }
                        checkBlock.boardId = board.id
                        checkBlock.parentId = outCard.id
                        blocks.push(checkBlock)

                        outCard.fields.contentOrder.push(checkBlock.id)
                    })
                }
            })
        }
    })

    console.log('')
    console.log(`Found ${input.cards.length} card(s).`)

    return [boards, blocks]
}
