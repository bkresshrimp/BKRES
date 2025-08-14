import {
    DATE_FORMAT_VIEW,
    DATE_TIME_FORMAT_VIEW,
} from '@/components/common/constant'
import { Pagination } from '@/components/ui/pagination/pagination'
import { TableView } from '@/components/ui/table'
import { TableViewTTXVN } from '@/components/ui/table/tableTTXVN'
import { getUserDetailFromLocalStorage } from '@/hooks/query/auth'
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
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { TooltipTable } from '@/components/ui/tooltip/tooltip'
import { GetAllITAssetsResponse, ViewConfigITAsset } from '@/models/api/it-asset-api'
import { useFilterForExportAssetsStore } from '@/hooks/zustand/filter-for-export-assets'

interface AssetsProps {
    getAllAssetsData: GetAllITAssetsResponse
    isPreviousData?: boolean
    fieldsConfig: ViewConfigITAsset[]
}

// Tạo columnHelper bên ngoài component
const columnHelper = createColumnHelper<TicketReportGetDetail>()

// Debug hook để track re-renders
const useWhyDidYouUpdate = (name: string, props: Record<string, any>) => {
    const previousProps = useRef<Record<string, any>>()
    
    useEffect(() => {
        if (previousProps.current) {
            const allKeys = Object.keys({ ...previousProps.current, ...props })
            const changedProps: Record<string, any> = {}
            
            allKeys.forEach(key => {
                if (previousProps.current![key] !== props[key]) {
                    changedProps[key] = {
                        from: previousProps.current![key],
                        to: props[key]
                    }
                }
            })
            
            if (Object.keys(changedProps).length) {
                console.log('[WHY-DID-YOU-UPDATE]', name, changedProps)
            }
        }
        
        previousProps.current = props
    })
}

const ReportAssetsTable = React.memo((props: AssetsProps) => {
    console.log('🔄 ReportAssetsTable RENDER')
    
    const filterAssets = useFilterForExportAssetsStore()
    const { t } = useTranslation()
    const lang = i18n.language
    
    // Debug what causes re-renders
    useWhyDidYouUpdate('ReportAssetsTable', {
        getAllAssetsData: props.getAllAssetsData,
        isPreviousData: props.isPreviousData,
        fieldsConfig: props.fieldsConfig,
        filterAssets: filterAssets?.filter,
        lang
    })
    
    const prevSortRef = useRef<string>('')
    const renderCountRef = useRef(0)
    renderCountRef.current += 1
    
    console.log(`📊 Render count: ${renderCountRef.current}`)
    
    const [data, setData] = React.useState(() => {
        console.log('🔧 Initial data state')
        return [...props.getAllAssetsData?.data! ?? []]
    })
    
    const [sorting, setSorting] = React.useState<SortingState>(() => {
        console.log('🔧 Initial sorting state')
        return (filterAssets?.filter?.sort ?? []).map((val: any) => ({
            id: val.name,
            desc: val.type,
        }))
    })

    // Memoize filterAssets để tránh dependency thay đổi
    const stableFilterAssets = useMemo(() => filterAssets, [filterAssets?.filter])

    const updateSorting = useCallback((newSorting: SortingState) => {
        console.log('🔄 updateSorting called', newSorting)
        const nextSort = newSorting?.map((val: any) => ({
            name: val.id,
            type: val.desc,
        }))
        
        const sortString = JSON.stringify(nextSort)
        
        if (prevSortRef.current !== sortString) {
            console.log('✅ Sorting actually changed, updating store')
            prevSortRef.current = sortString
            stableFilterAssets?.update(
                produce(stableFilterAssets?.filter, (draftState: any) => {
                    if (draftState) draftState.sort = nextSort
                })
            )
        } else {
            console.log('⏭️ Sorting unchanged, skipping update')
        }
    }, [stableFilterAssets])

    useEffect(() => {
        console.log('🔄 Sorting effect triggered')
        updateSorting(sorting)
    }, [sorting, updateSorting])

    useEffect(() => {
        console.log('🔄 Data effect triggered')
        const newData = [...props.getAllAssetsData?.data!]
        setData(prevData => {
            const hasChanged = JSON.stringify(prevData) !== JSON.stringify(newData)
            console.log('📊 Data changed:', hasChanged)
            return hasChanged ? newData : prevData
        })
    }, [props.getAllAssetsData?.data])

    // Stable fieldsConfig
    const stableFieldsConfig = useMemo(() => {
        console.log('🔄 fieldsConfig memoized')
        return props.fieldsConfig
    }, [JSON.stringify(props.fieldsConfig)])

    const listColumn = useMemo(() => {
        console.log('🔄 listColumn memoized')
        return stableFieldsConfig.reduce((acc: any, item) => {
            acc[item.name] = item.is_show
            return acc
        }, {})
    }, [stableFieldsConfig])

    const columnOrder = useMemo(() => {
        console.log('🔄 columnOrder memoized')
        return ['choose', ...Object.keys(listColumn)]
    }, [listColumn])

    // Tách riêng cell components để tránh tạo mới
    const LinkCell = useCallback(({ info, isNumber }: any) => (
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
    ), [])

    const DateTimeCell = useCallback(({ info }: any) => (
        <p>
            {info.getValue()
                ? dayjs(info.getValue() as string).format(DATE_TIME_FORMAT_VIEW)
                : ''}
        </p>
    ), [])

    const DateCell = useCallback(({ info }: any) => (
        <p>
            {info.getValue()
                ? dayjs(info.getValue() as string).format(DATE_FORMAT_VIEW)
                : ''}
        </p>
    ), [])

    const columns = useMemo(() => {
        console.log('🔄 columns memoized')
        const list: any[] = []
        
        stableFieldsConfig?.forEach((column: any) => {
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
        return list
    }, [stableFieldsConfig, lang, LinkCell, DateTimeCell, DateCell])

    const handlePageChange = useCallback((page: number) => {
        console.log('🔄 Page change:', page)
        stableFilterAssets?.update(
            produce(stableFilterAssets?.filter, (draftState: any) => {
                draftState.page = page - 1
            })
        )
    }, [stableFilterAssets])

    const handleLimitChange = useCallback((limit: number) => {
        console.log('🔄 Limit change:', limit)
        stableFilterAssets.update(
            produce(stableFilterAssets.filter, (draftState: any) => {
                draftState.limit = limit
            })
        )
    }, [stableFilterAssets])

    // Memoize table instance
    const table = useMemo(() => {
        console.log('🔄 Table instance created')
        return useReactTable({
            data: data,
            columns: columns,
            getCoreRowModel: getCoreRowModel(),
            state: {
                columnVisibility: listColumn,
                columnOrder,
                sorting,
            },
            onSortingChange: setSorting,
            sortDescFirst: false,
            pageCount: 0,
            debugTable: false,
        })
    }, [data, columns, listColumn, columnOrder, sorting])

    const paginationLabel = useMemo(() => {
        console.log('🔄 Pagination label memoized')
        if (props.getAllAssetsData.total > 0) {
            return (
                <div className="hidden md:block">
                    {t('pagination.range', {
                        start: props.getAllAssetsData.page * stableFilterAssets?.filter?.limit + 1,
                        end: props.getAllAssetsData.page * stableFilterAssets?.filter?.limit + data.length,
                        total_page: props.getAllAssetsData?.total,
                    })}
                </div>
            )
        }
        return <></>
    }, [
        props.getAllAssetsData.total,
        props.getAllAssetsData.page,
        stableFilterAssets?.filter?.limit,
        data.length,
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
                        limit: stableFilterAssets?.filter?.limit,
                        onChange: handleLimitChange,
                    }}
                    isPreviousData={props.isPreviousData}
                />
            </div>
        </>
    )
}, (prevProps, nextProps) => {
    // Custom comparison function
    const isEqual = (
        JSON.stringify(prevProps.getAllAssetsData) === JSON.stringify(nextProps.getAllAssetsData) &&
        JSON.stringify(prevProps.fieldsConfig) === JSON.stringify(nextProps.fieldsConfig) &&
        prevProps.isPreviousData === nextProps.isPreviousData
    )
    
    console.log('🔍 React.memo comparison:', isEqual ? 'EQUAL (skip render)' : 'DIFFERENT (will render)')
    return isEqual
})

ReportAssetsTable.displayName = 'ReportAssetsTable'

export default ReportAssetsTable