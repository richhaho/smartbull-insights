import React, { Component } from 'react';
import {get, map, difference, values, flatten} from 'lodash'
import copy from 'copy-to-clipboard';

import './raw-holdings.css';

import DataGrid from '@zippytech/react-datagrid-pro'
import filter from '@zippytech/react-datagrid-pro/filter'
import ReactJson from 'react-json-view'

import {SBUtils} from 'services/sb-utils'
import {foreignHoldings} from "models/foreign_holdings";

class RawHoldings extends Component {
    state = {
        columns: [],
        dataSource: [],
        groupBy: [],
        filterValue: [],
        cellSelection: []
    }

    constructor(props){
        super(props);

        this.onGroupByChange = this.onGroupByChange.bind(this);
        this.onFilterValueChange = this.onFilterValueChange.bind(this)
        this.onCellSelectionChange = this.onCellSelectionChange.bind(this);
        this.copyToClipboard = this.copyToClipboard.bind(this);
    }

    componentWillMount(){

        const
            dataSource = foreignHoldings.getAllRawData(),
            COLS = foreignHoldings.COL_MAPPING,
            reportingPeriodCols = [
                COLS.units,
                COLS.priceUsd,
                COLS.usdConversionRate,
                COLS.marketValueUsd,
            ],
            baseCols = difference(['_id'].concat(values(COLS)), [
                COLS.reportingPeriod,
            ].concat(reportingPeriodCols)),
            periodCols = foreignHoldings.periodsOrdered,
            columns = map(baseCols, col=>{

                let colDef= {
                    name: col,
                }

                if (foreignHoldings.NUMERIC_COLS.includes(col)){
                    colDef.type = 'number';
                };

                switch (col) {
                    case '_id':
                    case COLS.reportingPeriod:
                    case COLS.reportingInstitution:
                    case COLS.inst:
                    case COLS.instType:
                    case COLS.managingCompany:
                    case COLS.isin:
                    case COLS.secName:
                    case COLS.securityOfficialType:
                    case COLS.issuer:
                    case COLS.category:
                    case COLS.assetClass:
                    case COLS.currency:
                        colDef.groupBy = true;
                        break;
                    default:
                        colDef.groupBy = false;
                }
                // colDef
                return colDef;
            })
                .concat(
                    flatten(
                        periodCols.map(periodCol => {
                            const colDef$ = {
                                name: periodCol + ' $',
                                type: 'number',
                                render: ({data, value}) => {
                                    const val = foreignHoldings.getHoldingPeriodVal(data, periodCol);
                                    return SBUtils.shortNumberRenderer(val);
                                }
                            }

                            const colDefDetailed = {
                                name: periodCol + ' detailed',
                                minWidth: 10,
                                render: ({data})=>{
                                    return reportingPeriodCols.map(fld=>data[periodCol] ? `${fld}: ${data[periodCol][fld]}` : '').join('  ')
                                }
                            }


                            return [colDef$, colDefDetailed];
                        })
                    )
                ).concat([
                    {
                        name: 'srcRowsIndex', header: 'rows in google',
                        render: ({value})=>value.join(',')
                    }
                ])
                // defaults:
                .map(col=>{
                    col.flex = col.flex || 1;
                    col.minWidth = col.minWidth || 150;
                    return col;
                }),

            filterValue = [
                '_id',
                COLS.reportingPeriod,
                COLS.reportingInstitution,
                COLS.inst,
                COLS.instType,
                COLS.managingCompany,
                COLS.isin,
                COLS.secName,
                COLS.securityOfficialType,
                COLS.issuer,
                COLS.category,
                COLS.assetClass,
                COLS.currency,
                'srcRowsIndex',
            ].map(fld=>{
                return {
                    name: fld,
                    type: 'string',
                    operator: 'contains',
                }
            });

        console.log("columns", columns);

        this.setState({dataSource, columns, filterValue})


    }

    isSBAdm(){
        return get(this.props, 'user.sbadm')
    }

    onGroupByChange(groupBy) {
        this.setState({ groupBy })
    }

    onFilterValueChange(filterValue) {
        const dataSource = filter(foreignHoldings.getAllRawData(), filterValue)
        this.setState({dataSource, filterValue})
    }

    onCellSelectionChange(cellSelection) {
        // console.log("cellSelection", cellSelection)
        this.setState({
            cellSelection
        })
    }

    copyToClipboard(){
        copy(this.state.cellSelection);
    }

    renderRawHoldings(){
        const {
            columns,
            dataSource,
            groupBy,
            filterValue,
            cellSelection,
        } = this.state;

        return (
            <DataGrid
                idProperty={'_id'}
                columns={columns}
                dataSource={dataSource}
                pagination
                groupBy={groupBy}
                onGroupByChange={this.onGroupByChange}

                filterValue={filterValue}
                onFilterValueChange={this.onFilterValueChange}

                editable={true}

                selectOnDrag={true}
                defaultCellSelection={cellSelection}
                onCellSelectionChange={this.onCellSelectionChange}


            />
        )
    }

    render(){
        if (!this.isSBAdm()){
            return (<div>unauthorized</div>)
        }

        return (
            <div>
                <div className="text-center">
                    <h1>Raw Holdings admin</h1>
                    {/*<div className="flex-row">*/}
                        {/*<div>{this.state.cellSelection}</div>*/}
                        {/*<button onClick={this.copyToClipboard}>copy to clipboard</button>*/}
                    {/*</div>*/}
                </div>
                <div className="raw-holdings-container">
                    {this.renderRawHoldings()}
                </div>

                {foreignHoldings.getRawDataSums() &&
                (<div>
                    <h2>Sums per Src</h2>
                    <ReactJson src={foreignHoldings.getRawDataSums()}
                               collapsed={1}
                    />

                </div>)}

                {foreignHoldings.getRawDataProcessingErrors() &&
                (<div>
                    <h2>Processing Errors</h2>
                    <ReactJson src={foreignHoldings.getRawDataProcessingErrors()}
                               collapsed={1}
                    />

                </div>)}

            </div>)
    }
}

export {RawHoldings};
