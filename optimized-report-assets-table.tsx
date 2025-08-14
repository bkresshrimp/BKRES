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

// Tạo columnHelper bên ngoài component để tránh tạo mới mỗi lần render
const columnHelper = createColumnHelper<TicketReportGetDetail>()

const ReportAssetsTable = React.memo((props: AssetsProps) => {
    const filterAssets = useFilterForExportAssetsStore()
    const { t } = useTranslation()
    const lang = i18n.language
    
    // Sử dụng useRef để lưu trữ previous values và tránh so sánh không cần thiết
    const prevSortRef = useRef<string>('')
    
    const [data, setData] = React.useState(() => [
        ...props.getAllAssetsData?.data! ?? [],
    ])
    
    const [sorting, setSorting] = React.useState<SortingState>(() =>
        (filterAssets?.filter?.sort ?? []).map((val: any) => ({
            id: val.name,
            desc: val.type,
        }))
    )

    // Memoize sorting update function
    const updateSorting = useCallback((newSorting: SortingState) => {
        const nextSort = newSorting?.map((val: any) => ({
            name: val.id,
            type: val.desc,
        }))
        
        const sortString = JSON.stringify(nextSort)
        
        // Chỉ update khi thực sự có thay đổi
        if (prevSortRef.current !== sortString) {
            prevSortRef.current = sortString
            filterAssets?.update(
                produce(filterAssets?.filter, (draftState: any) => {
                    if (draftState) draftState.sort = nextSort
                })
            )
        }
    }, [filterAssets])

    // Tối ưu useEffect cho sorting
    useEffect(() => {
        updateSorting(sorting)
    }, [sorting, updateSorting])

    // Tối ưu useEffect cho data update
    useEffect(() => {
        const newData = [...props.getAllAssetsData?.data!]
        setData(prevData => {
            // Chỉ update nếu data thực sự thay đổi
            if (JSON.stringify(prevData) !== JSON.stringify(newData)) {
                return newData
            }
            return prevData
        })
    }, [props.getAllAssetsData?.data])

    // Memoize visibility map với dependency chính xác
    const listColumn = useMemo(() => {
        return props.fieldsConfig.reduce((acc: any, item) => {
            acc[item.name] = item.is_show
            return acc
        }, {})
    }, [props.fieldsConfig])

    // Memoize columnOrder
    const columnOrder = useMemo(
        () => ['choose', ...Object.keys(listColumn)],
        [listColumn]
    )

    // Memoize column creation functions
    const columnCreators = useMemo(() => ({
        LINK: (column: any) => {
            const isNumber = column.name === 'asset_name' || column.name === 'asset_code'
            return columnHelper.accessor(column.name, {
                id: column.name,
                header: column.titles?.[lang] || column.title,
                cell: (info) => (
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
                ),
                enableColumnFilter: false,
                sortDescFirst: false,
                meta: isNumber ? 'w-boolean' : 'w-name',
            })
        },
        DATE_TIME: (column: any) => {
            return columnHelper.accessor(column.name as keyof TicketReportGetDetail, {
                id: column.name,
                header: column.titles?.[lang] || column.title,
                cell: (info) => (
                    <p>
                        {info.getValue()
                            ? dayjs(info.getValue() as string).format(DATE_TIME_FORMAT_VIEW)
                            : ''}
                    </p>
                ),
                enableColumnFilter: true,
                sortDescFirst: false,
                meta: 'w-name-short',
            })
        },
        DATE: (column: any) => {
            return columnHelper.accessor(column.name as keyof TicketReportGetDetail, {
                id: column.name,
                header: column.titles?.[lang] || column.title,
                cell: (info) => (
                    <p>
                        {info.getValue()
                            ? dayjs(info.getValue() as string).format(DATE_FORMAT_VIEW)
                            : ''}
                    </p>
                ),
                enableColumnFilter: true,
                sortDescFirst: false,
                meta: 'w-name-short',
            })
        },
        OTHER: (column: any) => {
            return columnHelper.accessor(column.name as keyof TicketReportGetDetail, {
                id: column.name,
                header: column.titles?.[lang] || column.title,
                enableColumnFilter: true,
                sortDescFirst: false,
                meta: 'w-name-short',
            })
        },
    }), [lang])

    // Memoize columns với dependencies chính xác
    const columns = useMemo(() => {
        const list: any[] = []
        props.fieldsConfig?.forEach((column: any) => {
            if (column.name === 'asset_name' || column.name === 'asset_code') {
                list.push(columnCreators.LINK(column))
            } else if (column.value_type === 'DATE_TIME') {
                list.push(columnCreators.DATE_TIME(column))
            } else if (column.value_type === 'SHORT_DATE') {
                list.push(columnCreators.DATE(column))
            } else {
                list.push(columnCreators.OTHER(column))
            }
        })
        return list
    }, [props.fieldsConfig, columnCreators])

    // Memoize pagination handlers
    const handlePageChange = useCallback((page: number) => {
        filterAssets?.update(
            produce(filterAssets?.filter, (draftState: any) => {
                draftState.page = page - 1
            })
        )
    }, [filterAssets])

    const handleLimitChange = useCallback((limit: number) => {
        filterAssets.update(
            produce(filterAssets.filter, (draftState: any) => {
                draftState.limit = limit
            })
        )
    }, [filterAssets])

    // Memoize table configuration
    const tableConfig = useMemo(() => ({
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
        debugTable: false, // Tắt debug để tránh log không cần thiết
    }), [data, columns, listColumn, columnOrder, sorting])

    const table = useReactTable(tableConfig)

    // Memoize pagination label
    const paginationLabel = useMemo(() => {
        if (props.getAllAssetsData.total > 0) {
            return (
                <div className="hidden md:block">
                    {t('pagination.range', {
                        start: props.getAllAssetsData.page * filterAssets?.filter?.limit + 1,
                        end: props.getAllAssetsData.page * filterAssets?.filter?.limit + data.length,
                        total_page: props.getAllAssetsData?.total,
                    })}
                </div>
            )
        }
        return <></>
    }, [
        props.getAllAssetsData.total,
        props.getAllAssetsData.page,
        filterAssets?.filter?.limit,
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
                        limit: filterAssets?.filter?.limit,
                        onChange: handleLimitChange,
                    }}
                    isPreviousData={props.isPreviousData}
                />
            </div>
        </>
    )
})

ReportAssetsTable.displayName = 'ReportAssetsTable'

export default ReportAssetsTable