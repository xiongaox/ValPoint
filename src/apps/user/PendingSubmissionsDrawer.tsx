/**
 * PendingSubmissionsDrawer - 占位组件（本地版本）
 */
import React from 'react';

interface Props {
    isOpen?: boolean;
    onClose?: () => void;
    [key: string]: any;
}

export default function PendingSubmissionsDrawer(props: Props) {
    if (!props.isOpen) return null;
    return null;
}
