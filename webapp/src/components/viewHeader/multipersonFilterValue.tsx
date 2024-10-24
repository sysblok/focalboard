// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {useIntl} from 'react-intl'

import {MultiValue} from 'react-select'

import {useAppDispatch} from '../../store/hooks'
import {updateViewFilter} from '../../store/views'

import {Utils} from '../../utils'
import {BoardView} from '../../blocks/boardView'

import {FilterClause} from '../../blocks/filterClause'
import {createFilterGroup} from '../../blocks/filterGroup'

import PersonSelector from '../personSelector'
import {IUser} from '../../user'

import './multiperson.scss'

type Props = {
    view: BoardView
    filter: FilterClause
}

const MultiPersonFilterValue = (props: Props): JSX.Element => {
    const {filter, view} = props
    const intl = useIntl()
    const dispatch = useAppDispatch()
    const emptyDisplayValue = intl.formatMessage({id: 'ConfirmPerson.search', defaultMessage: 'Search...'})

    return (
        <PersonSelector
            userIDs={filter.values}
            allowAddUsers={false}
            isMulti={true}
            readOnly={false}
            emptyDisplayValue={emptyDisplayValue}
            showMe={true}
            closeMenuOnSelect={false}
            onChange={(items: MultiValue<IUser>, action) => {
                const filterIndex = view.fields.filter.filters.indexOf(filter)
                Utils.assert(filterIndex >= 0, "Can't find filter")

                const filterGroup = createFilterGroup(view.fields.filter)
                const newFilter = filterGroup.filters[filterIndex] as FilterClause
                Utils.assert(newFilter, `No filter at index ${filterIndex}`)

                if (action.action === 'select-option') {
                    newFilter.values = items.map((a) => a.id)
                } else if (action.action === 'clear') {
                    newFilter.values = []
                } else if (action.action === 'remove-value') {
                    newFilter.values = items.filter((a) => a.id !== action.removedValue.id).map((b) => b.id) || []
                }
                dispatch(updateViewFilter(filterGroup))
            }}
        />
    )
}

export default MultiPersonFilterValue
