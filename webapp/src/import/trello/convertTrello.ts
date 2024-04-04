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
import {createCommentBlock} from '../../blocks/commentBlock'
import {slugify} from 'transliteration';

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

export function makeUsername(username: string, fullName: string): string {
    if (username.startsWith('user')) {
        return slugify(fullName)
    }
    return username
}

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

    const optionLabelIdMap = new Map<string, string>()
    const optionsLabel: IPropertyOption[] = []
    input.labels.forEach(label => {
        console.log(`Label: ${label.name}`)
        const optionId = Utils.createGuid()
        optionLabelIdMap.set(label.id, optionId)
        const color = optionColors[optionColorIndex % optionColors.length]
        optionColorIndex += 1
        const option: IPropertyOption = {
            id: optionId,
            value: label.name,
            color,
        }
        optionsLabel.push(option)
    })

    const listProperty: IPropertyTemplate = {
        id: Utils.createGuid(),
        name: 'List',
        type: 'select',
        options
    }
    const labelProperty: IPropertyTemplate = {
        id: Utils.createGuid(),
        name: 'Label',
        type: 'multiSelect',
        options: optionsLabel
    }
    const memberProperty: IPropertyTemplate = {
        id: Utils.createGuid(),
        name: 'Assignee',
        type: 'multiPerson',
        options: []
    }
    const dueProperty: IPropertyTemplate = {
        id: Utils.createGuid(),
        name: 'Due',
        type: 'date',
        options: []
    }
    const trelloURLProperty: IPropertyTemplate = {
        id: Utils.createGuid(),
        name: 'Trello URL',
        type: 'url',
        options: []
    }
    const createdAtProperty: IPropertyTemplate = {
        id: Utils.createGuid(),
        name: 'Created At',
        type: 'createdTime',
        options: []
    }
    const createdByProperty: IPropertyTemplate = {
        id: Utils.createGuid(),
        name: 'Created By',
        type: 'createdBy',
        options: []
    }
    board.cardProperties = [
        createdAtProperty,
        createdByProperty,
        listProperty,
        labelProperty,
        memberProperty,
        dueProperty,
        trelloURLProperty
    ]

    const customFieldIdMap = new Map<string, string>()
    if (input.customFields) {
        input.customFields.forEach((f) => {
            const field: IPropertyTemplate = {
                id: Utils.createGuid(),
                name: f.name,
                type: 'text',
                options: []
            }
            customFieldIdMap.set(f.id, field.id)
            board.cardProperties = [...board.cardProperties, field]
        })
    }
    boards.push(board)

    // Board view
    const view = createBoardView()
    view.title = 'Board View'
    view.fields.viewType = 'board'
    view.boardId = board.id
    view.parentId = board.id
    blocks.push(view)

    // Cards
    const cardIdMap = new Map<string, string>()
    input.cards.filter(
        // don't import archived cards
        // TODO move into optional flag
        (card) => card.closed == false
    ).forEach(card => {
        // console.log(`Card: ${card.name}`)

        const outCard = createCard()
        cardIdMap.set(card.id, outCard.id)
        outCard.title = card.name
        outCard.boardId = board.id
        outCard.parentId = board.id

        // Map lists to Select property options
        if (card.idList) {
            const optionId = optionIdMap.get(card.idList)
            if (optionId) {
                outCard.fields.properties[listProperty.id] = optionId
            } else {
                console.warn(`Invalid idList: ${card.idList} for card: ${card.name}`)
                // don't import cards without list
                return
            }
        } else {
            console.warn(`Missing idList for card: ${card.name}`)
            // don't import cards without list
            return
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

        // Add created by, create at
        // TODO alexeyqu fallback to Trello API if no information found (very common)
        input.actions.filter((action) => action.type == 'createCard' && action.data.card?.id == card.id).map(
            (action) => {
                outCard.createAt = Date.parse(action.date)
                outCard.createdBy = memberIdMap.get(action.idMemberCreator.toString()) ?? ''
            }
        )

        // Add trello URL
        if (card.shortUrl) {
            outCard.fields.properties[trelloURLProperty.id] = card.shortUrl
        }

        // Add labels
        if (card.labels) {
            card.labels.forEach(label => {
                const optionId = optionLabelIdMap.get(label.id)
                if (optionId) {
                    if (outCard.fields.properties[labelProperty.id]) {
                        outCard.fields.properties[labelProperty.id] = [...outCard.fields.properties[labelProperty.id], optionId]
                    } else {
                        outCard.fields.properties[labelProperty.id] = [optionId]
                    }
                } else {
                    console.warn(`not found label for ${label.id}`)
                }
            })
        }

        // Add due date
        if (card.due) {
            outCard.fields.properties[dueProperty.id] = `{\"to\":${Date.parse(card.due)}}`
        }

        // Add assignees
        if (card.idMembers && card.idMembers.length > 0) {
            card.idMembers.forEach(idMember => {
                const focalboardId = memberIdMap.get(idMember.toString())
                if (focalboardId) {
                    if (outCard.fields.properties[memberProperty.id]) {
                        outCard.fields.properties[memberProperty.id] = [...outCard.fields.properties[memberProperty.id], focalboardId]
                    } else {
                        outCard.fields.properties[memberProperty.id] = [focalboardId]
                    }
                } else {
                    console.warn(`Not found card member for: ${idMember} for card: ${card.name}`)
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

        // Add custom fields
        if (card.customFieldItems && card.customFieldItems.length > 0) {
            card.customFieldItems.forEach((f) => {
                const lookup = customFieldIdMap.get(f.idCustomField)
                if (lookup) {
                    outCard.fields.properties[lookup] = f.value.text ?? 'not found'
                }
            })
        }
    })

    input.actions.filter((action) => action.type == 'commentCard').forEach((action) => {
        // Add comments
        if (action.type == 'commentCard' && action.data.card) {
            const cardId = cardIdMap.get(action.data.card.id)
            const creatorId = memberIdMap.get(action.idMemberCreator)
            const text = action.data.text
            if (cardId && creatorId && text) {
                const comment = createCommentBlock()
                comment.parentId = cardId
                comment.createdBy = creatorId
                // dunno if we can update comments
                comment.modifiedBy = comment.createdBy
                comment.title = text
                comment.createAt = Date.parse(action.date)
                // dunno if we can update comments
                comment.updateAt = comment.createAt
                comment.deleteAt = 0
                comment.boardId = board.id
                blocks.push(comment)
            }
        }
    })

    console.log('')
    console.log(`Found ${input.cards.length} card(s).`)

    return [boards, blocks]
}
