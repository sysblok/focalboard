import React from 'react'
import { FormattedMessage } from 'react-intl'
import './userSearchForm.scss'

interface UserSearchFormProps {
    searchTerm: string
    onSearchChange: (value: string) => void
    resultsCount: number
    totalCount: number
}

const UserSearchForm: React.FC<UserSearchFormProps> = ({
    searchTerm,
    onSearchChange,
    resultsCount,
    totalCount
}) => {
    return (
        <div className='UserSearchForm'>
            <div className='search-input-container'>
                <input
                    type='text'
                    placeholder='Search by email or nickname...'
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className='search-input'
                />
                {searchTerm && (
                    <button
                        className='clear-button'
                        onClick={() => onSearchChange('')}
                        aria-label='Clear search'
                    >
                        ×
                    </button>
                )}
            </div>

            {searchTerm && (
                <div className='search-results-info'>
                    <FormattedMessage
                        id='Admin.searchResults'
                        defaultMessage='Found {resultsCount} of {totalCount} users'
                        values={{ resultsCount, totalCount }}
                    />
                </div>
            )}
        </div>
    )
}

export default UserSearchForm
