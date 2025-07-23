
import React from 'react'
import './layout.scss'

interface LayoutProps {
    children: React.ReactNode
    className?: string
}

const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
    return (
        <div className={`Layout ${className}`}>
            {children}
        </div>
    )
}

export default Layout
