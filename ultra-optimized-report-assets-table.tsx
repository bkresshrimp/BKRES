import {
    DATE_FORMAT_VIEW,
    DATE_TIME_FORMAT_VIEW,
} from '@/components/common/constant'
import { Pagination } from '@/components/ui/pagination/pagination'
import { TableView } from '@/components/ui/table'
import { TooltipTable } from '@/components/ui/tooltip/tooltip'
import i18n from '@/i18n'
import {
    TicketReportGetDetail,
} from '@/models/api'
import {
    ColumnDef,
    SortingState,
    createColumnHelper,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table'
import dayjs from 'dayjs'
import produce from 'immer'
import Link from 'next/link'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GetAllITAssetsResponse, ViewConfigITAsset } from '@/models/api/it-asset-api'
import { useFilterForExportAssetsStore } from '@/hooks/zustand/filter-for-export-assets'

interface AssetsProps {
    getAllAssetsData: GetAllITAssetsResponse
    isPreviousData?: boolean
    fieldsConfig: ViewConfigITAsset[]
}

// Tạo columnHelper bên ngoài component - GLOBAL
const columnHelper = createColumnHelper<TicketReportGetDetail>()

// Cache cho columns để tránh tạo lại
const columnsCache = new Map<string, any[]>()

// Memoized cell components - GLOBAL
const LinkCell = React.memo(({ info, isNumber }: any) => (
    <div className="flex">
        <TooltipTable
            tootipDetail={
                <div className="max-w-[280px] whitespace-normal overflow-auto">
                    <div className="line-clamp-2">{info.getValue()}</div>
                </div>
            }
            placementTootip="bottom-start"
        >
            <Link
                href={`/it-asset/${info.row.original.id}`}
                className={`relative text-primary-base truncate w-full block ${isNumber ? ' ml-1' : ''}`}
                target="_blank"
            >
                {info.getValue()}
            </Link>
        </TooltipTable>
    </div>
))

const DateTimeCell = React.memo(({ info }: any) => (
    <p>
        {info.getValue()
            ? dayjs(info.getValue() as string).format(DATE_TIME_FORMAT_VIEW)
            : ''}
    </p>
))

const DateCell = React.memo(({ info }: any) => (
    <p>
        {info.getValue()
            ? dayjs(info.getValue() as string).format(DATE_FORMAT_VIEW)
            : ''}
    </p>
))

LinkCell.displayName = 'LinkCell'
DateTimeCell.displayName = 'DateTimeCell'
DateCell.displayName = 'DateCell'

// Tạo columns factory function
const createColumns = (fieldsConfig: ViewConfigITAsset[], lang: string) => {
    const cacheKey = `${JSON.stringify(fieldsConfig)}-${lang}`
    
    if (columnsCache.has(cacheKey)) {
        return columnsCache.get(cacheKey)!
    }
    
    const list: any[] = []
    
    fieldsConfig?.forEach((column: any) => {
        if (column.name === 'asset_name' || column.name === 'asset_code') {
            const isNumber = column.name === 'asset_name' || column.name === 'asset_code'
            list.push(columnHelper.accessor(column.name, {
                id: column.name,
                header: column.titles?.[lang] || column.title,
                cell: (info) => <LinkCell info={info} isNumber={isNumber} />,
                enableColumnFilter: false,
                sortDescFirst: false,
                meta: isNumber ? 'w-boolean' : 'w-name',
            }))
        } else if (column.value_type === 'DATE_TIME') {
            list.push(columnHelper.accessor(column.name as keyof TicketReportGetDetail, {
                id: column.name,
                header: column.titles?.[lang] || column.title,
                cell: (info) => <DateTimeCell info={info} />,
                enableColumnFilter: true,
                sortDescFirst: false,
                meta: 'w-name-short',
            }))
        } else if (column.value_type === 'SHORT_DATE') {
            list.push(columnHelper.accessor(column.name as keyof TicketReportGetDetail, {
                id: column.name,
                header: column.titles?.[lang] || column.title,
                cell: (info) => <DateCell info={info} />,
                enableColumnFilter: true,
                sortDescFirst: false,
                meta: 'w-name-short',
            }))
        } else {
            list.push(columnHelper.accessor(column.name as keyof TicketReportGetDetail, {
                id: column.name,
                header: column.titles?.[lang] || column.title,
                enableColumnFilter: true,
                sortDescFirst: false,
                meta: 'w-name-short',
            }))
        }
    })
    
    columnsCache.set(cacheKey, list)
    return list
}

// Component chính với tối ưu tối đa
const ReportAssetsTable = (props: AssetsProps) => {
    const filterAssets = useFilterForExportAssetsStore()
    const { t } = useTranslation()
    const lang = i18n.language
    
    // Refs để tránh re-render
    const sortingRef = useRef<SortingState>([])
    const dataRef = useRef<any[]>([])
    const columnsRef = useRef<any[]>([])
    const listColumnRef = useRef<any>({})
    const columnOrderRef = useRef<string[]>([])
    
    // State chỉ cho những thứ thực sự cần re-render
    const [, forceUpdate] = useState({})
    const rerender = useCallback(() => forceUpdate({}), [])
    
    // Initialize data
    if (dataRef.current.length === 0) {
        dataRef.current = [...props.getAllAssetsData?.data! ?? []]
    }
    
    // Initialize sorting
    if (sortingRef.current.length === 0) {
        sortingRef.current = (filterAssets?.filter?.sort ?? []).map((val: any) => ({
            id: val.name,
            desc: val.type,
        }))
    }
    
    // Update data only when actually changed
    const newDataString = JSON.stringify(props.getAllAssetsData?.data)
    const currentDataString = JSON.stringify(dataRef.current)
    if (newDataString !== currentDataString) {
        dataRef.current = [...props.getAllAssetsData?.data! ?? []]
    }
    
    // Update columns only when fieldsConfig or lang changes
    const newColumns = createColumns(props.fieldsConfig, lang)
    if (columnsRef.current !== newColumns) {
        columnsRef.current = newColumns
    }
    
    // Update listColumn
    const newListColumn = props.fieldsConfig.reduce((acc: any, item) => {
        acc[item.name] = item.is_show
        return acc
    }, {})
    
    if (JSON.stringify(listColumnRef.current) !== JSON.stringify(newListColumn)) {
        listColumnRef.current = newListColumn
        columnOrderRef.current = ['choose', ...Object.keys(newListColumn)]
    }
    
    // Sorting handler - không gây re-render
    const handleSortingChange = useCallback((updater: any) => {
        const newSorting = typeof updater === 'function' ? updater(sortingRef.current) : updater
        
        const nextSort = newSorting?.map((val: any) => ({
            name: val.id,
            type: val.desc,
        }))
        
        const sortString = JSON.stringify(nextSort)
        const currentSortString = JSON.stringify(sortingRef.current.map((val: any) => ({
            name: val.id,
            type: val.desc,
        })))
        
        if (sortString !== currentSortString) {
            sortingRef.current = newSorting
            
            // Update store
            filterAssets?.update(
                produce(filterAssets?.filter, (draftState: any) => {
                    if (draftState) draftState.sort = nextSort
                })
            )
            
            // Force re-render chỉ khi cần
            rerender()
        }
    }, [filterAssets, rerender])
    
    // Pagination handlers
    const handlePageChange = useCallback((page: number) => {
        filterAssets?.update(
            produce(filterAssets?.filter, (draftState: any) => {
                draftState.page = page - 1
            })
        )
    }, [filterAssets])
    
    const handleLimitChange = useCallback((limit: number) => {
        filterAssets?.update(
            produce(filterAssets?.filter, (draftState: any) => {
                draftState.limit = limit
            })
        )
    }, [filterAssets])
    
    // Table instance - memoized với refs
    const table = useMemo(() => {
        return useReactTable({
            data: dataRef.current,
            columns: columnsRef.current,
            getCoreRowModel: getCoreRowModel(),
            state: {
                columnVisibility: listColumnRef.current,
                columnOrder: columnOrderRef.current,
                sorting: sortingRef.current,
            },
            onSortingChange: handleSortingChange,
            sortDescFirst: false,
            pageCount: 0,
            debugTable: false,
        })
    }, [handleSortingChange, dataRef.current, columnsRef.current])
    
    // Pagination label - memoized
    const paginationLabel = useMemo(() => {
        if (props.getAllAssetsData.total > 0) {
            return (
                <div className="hidden md:block">
                    {t('pagination.range', {
                        start: props.getAllAssetsData.page * filterAssets?.filter?.limit + 1,
                        end: props.getAllAssetsData.page * filterAssets?.filter?.limit + dataRef.current.length,
                        total_page: props.getAllAssetsData?.total,
                    })}
                </div>
            )
        }
        return null
    }, [
        props.getAllAssetsData.total,
        props.getAllAssetsData.page,
        filterAssets?.filter?.limit,
        dataRef.current.length,
        t
    ])
    
    return (
        <>
            <div className="flex gap-3 p-2 overflow-x-auto"></div>
            <TableView table={table} className="!h-table-report" />
            <div className="flex gap-2 py-4 px-8 border-t border-border-2 justify-end">
                <Pagination
                    changePage={handlePageChange}
                    pageCurrent={props.getAllAssetsData.page + 1}
                    totalPage={props.getAllAssetsData.total_page}
                    label={paginationLabel}
                    showLimit={{
                        limit: filterAssets?.filter?.limit,
                        onChange: handleLimitChange,
                    }}
                    isPreviousData={props.isPreviousData}
                />
            </div>
        </>
    )
}

export default ReportAssetsTable