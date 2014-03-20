import React, { Component } from 'react';
import {difference, keys, get, uniq, some} from 'lodash'

import './top-title.css'

import {PeriodSelector} from 'components/period-selector/period-selector'
import {foreignHoldings, ForeignHoldingsDataType} from "models/foreign_holdings";

import Row from 'react-bootstrap/lib/Row'
import Col from 'react-bootstrap/lib/Col'
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger'
import Tooltip from 'react-bootstrap/lib/Tooltip'
import Glyphicon from 'react-bootstrap/lib/Glyphicon'
import {NotMoblie} from "services/responsive"; 
import {SBUtils} from "services/sb-utils";

class TopTitle extends Component {
    state = {
        secSumDescs: []
    }

    componentWillMount(){
        this.setSecSumDescs();
    }

    setSecSumDescs() {
        const
            isMutualFundMode = (foreignHoldings.foreignHoldingsDataType === ForeignHoldingsDataType.MutualFund),
            srcDescs = ['Mutual Funds', 'ETFs'],
            [srcDesc, otherSrcSesc] = isMutualFundMode ? srcDescs : srcDescs.reverse(),
            {excludedTypes, excludedValue, includedTypes, includedValue} = (()=>{
                const getFromSrc = (src, includedTypes)=>{
                    const
                        srcSum = get(foreignHoldings.rawDataSums, [src, foreignHoldings.activePeriod], {}),
                        includedTypesWithInvalid = includedTypes.concat(foreignHoldings.INVALID_VALS).concat([
                            'Other'
                        ]),
                        excludedTypes = difference(keys(srcSum), includedTypesWithInvalid),
                        excludedValue = excludedTypes.reduce((acc, typ)=>{
                            acc += srcSum[typ] || 0;
                            return acc;
                        }, 0),
                        includedValue = includedTypes.reduce((acc, typ) => {
                            acc += srcSum[typ] || 0;
                            return acc;
                        }, 0);

                    // console.log("getFromSrc", {src, includedTypes, includedTypesWithInvalid, includedValue, excludedTypes, excludedValue})


                    return {excludedTypes, excludedValue, includedTypes, includedValue};

                }

                if (isMutualFundMode){
                    const
                        baseIncludedTypesMF = [foreignHoldings.SECURITY_OFFICIAL_TYPES.mutualFund],
                        {excludedTypes, excludedValue} =
                            getFromSrc('FOREIGN_MUTUAL_FUNDS_INST', baseIncludedTypesMF),
                        {includedTypes: includedTypesInst, includedValue: includedValueMFFromEtfInst} =
                            getFromSrc('FOREIGN_ETF_INST', baseIncludedTypesMF),
                        {includedTypes: includedTypesMF, includedValue: includedValueMFFromEtfMF} =
                            getFromSrc('FOREIGN_ETF_MUTUAL_FUNDS', baseIncludedTypesMF)
                    ;

                    return {excludedValue, excludedTypes,
                        includedTypes: uniq(includedTypesInst.concat(includedTypesMF)),
                        includedValue: includedValueMFFromEtfInst + includedValueMFFromEtfMF};
                }else{
                    const
                        baseIncludedTypesETF = [
                            foreignHoldings.SECURITY_OFFICIAL_TYPES.ETF,
                            foreignHoldings.SECURITY_OFFICIAL_TYPES.indexFund,
                        ],
                        {excludedTypes: excludedTypesInst, excludedValue: excludedValueInst} =
                            getFromSrc('FOREIGN_ETF_INST', baseIncludedTypesETF),
                        {excludedTypes: excludedTypesMF, excludedValue: excludedValueMF} =
                            getFromSrc('FOREIGN_ETF_MUTUAL_FUNDS', baseIncludedTypesETF),
                        {includedTypes: includedTypesFromMF, includedValue: includedValueETFFromMF} =
                            getFromSrc('FOREIGN_MUTUAL_FUNDS_INST', baseIncludedTypesETF),

                        excludedValue = excludedValueMF + excludedValueInst,
                        excludedTypes = uniq(excludedTypesMF.concat(excludedTypesInst)),
                        includedValue = includedValueETFFromMF,
                        includedTypes = includedTypesFromMF;
                    
                    // console.log("debug ETF secType", {includedTypes, includedValue, excludedTypesInst, excludedValueInst,excludedTypesMF, excludedValueMF,excludedTypes,excludedValue} );
                    return {excludedValue, excludedTypes, includedTypes, includedValue};
                }
            })(),

            buildStr= (types, value, include, srcDesc)=> {
                const
                    sz = types.length,
                    typesPlurals = types.map(e => e === foreignHoldings.SECURITY_OFFICIAL_TYPES.fundOfFunds ? e : e + 's'),
                    typesStr = typesPlurals.length === 1 ?
                        typesPlurals[0]
                        : `${typesPlurals.slice(0, sz - 1).join(', ')} and ${typesPlurals[sz - 1]}`,
                    resStr = value > 0.1 ?
                        `${include ? 'In' : 'Ex'}cluded Holdings: ${SBUtils.shortNumber$Renderer(value)} in ${typesStr} reported as ${srcDesc}`
                        : null

                // console.log("delme", resStr, {types, value, exclude})
                return resStr;
            },

            secSumDescs = [
                buildStr(includedTypes, includedValue, true, otherSrcSesc),
                buildStr(excludedTypes, excludedValue, false, srcDesc)
            ].filter(e=>!!e);


        this.setState({secSumDescs})
    }

    componentWillReceiveProps(nextProps) {
        if (
            (this.props.secType !== nextProps.secType) ||
            (this.props.period !== nextProps.period)
        ){
            this.setSecSumDescs();
        }
    }

    render(){
        if (/^\/admin/i.test(this.props.location.pathname)){
            return null;
        }

        const {secSumDescs} = this.state,
            secSumDescsSZ = secSumDescs.length;
        const
            tooltip = (
                <Tooltip id="tooltip">
                    {secSumDescs.map((e,i)=> {
                        const isNotLast = (i < secSumDescsSZ-1);

                        return <span key={`${secSumDescs}-${i}`}>
                          {e}.{isNotLast && <br/>}{isNotLast && <br/>}
                        </span>}
                    )}
                </Tooltip>)
        return (
            <div >
                <h2 className='text-center'>Institutional Holdings - {foreignHoldings.getForeignHoldingsDataType()}</h2>
                <Row>
                    <Col sm={4} smOffset={4}>
                        <PeriodSelector/>
                    </Col>
                    {some(secSumDescs) && <NotMoblie>
                        <Col sm={1} style={{marginLeft: '-22px'}}>
                            <OverlayTrigger placement="top" overlay={tooltip}>
                                <Glyphicon style={{top: '11px'}} glyph='info-sign'/>
                            </OverlayTrigger>
                        </Col>
                    </NotMoblie>}
                </Row>
            </div>
        )
    }

}







export {TopTitle};
