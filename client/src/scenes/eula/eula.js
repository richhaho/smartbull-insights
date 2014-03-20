
import React, { Component } from 'react';
import {isFunction} from 'lodash'

import './eula.css';

import {sbApi} from "services/sb-api";
import {Analytics} from 'services/analytics'

class Eula extends Component {
    state = {
        eulaApproveChecked: false,
    }

    constructor(props){
        super(props);

        this.onEulaSignedClicked = this.onEulaSignedClicked.bind(this);
        this.onEulaApproveCheckChange = this.onEulaApproveCheckChange.bind(this);
    }

    componentDidMount(){
        Analytics.modalView('eula');
    }

    onEulaSignedClicked(e){
        const signResp = sbApi.signEula({eulaVersion: this.props.currEulaVersion});
        if (signResp && isFunction(this.props.onEulaSignedCB)){
            this.props.onEulaSignedCB();
        }
    }

    onEulaApproveCheckChange(e){
        this.setState(({eulaApproveChecked})=>({
            eulaApproveChecked: !eulaApproveChecked
        }));
    }

    render(){
        return (
            <div className="flex-col" id="eula-container">
                <h2 className="text-center">
                    Terms of Service
                </h2>

                <hr/>

                <h4>
                    1. Acceptance of Terms
                </h4>
                <div>
                    The following are the terms and conditions for the use of SmartBull Insights as more fully defined in Section ‎2 below (the “Service”) offered and provided by SmartBull Ltd. ("we", "us", "our" or "SmartBull"). By accessing and using Service you ("you"
                    or "Customer") fully accept and agree to follow these terms of service ("Terms of Service"). These Terms of Service need not be signed to be binding. You can access these Terms of Service any time.
                </div>

                <h4>
                    2. Description of Services
                </h4>
                <div>
                    The Service is a service which aggregates data from various online public sources, and presents market trends and cross-sections in the field of traded securities "Services").
                </div>

                <h4>
                    3. License
                </h4>
                <div>
                    Subject to and conditioned upon Customer acceptance of these Terms of Service and Customer's ongoing compliance with these Terms of Service, SmartBull hereby grants Customer a non-exclusive, non-transferable, non-sublicensable, limited license to access
                    and use the Service, solely for the Customer’s own internal business use and in strict compliance with these Terms of Service.
                </div>

                <h4>
                    4. Use of the Service
                </h4>
                <div>
                    You will need to register to the Service via a username and password. You are responsible for keeping your account and password confidential and secure. You are fully responsible for all activities that occur in your account and the use of your password.
                    You agree to: (i) immediately report to us in case of any unauthorized use of your password, account or any other security breach. We shall not be responsible for any loss or damage incurred as a result of your violation of this term. By using
                    the Services you represent that you are of sufficient legal age to use or form a binding contract for the Service (or, if you are using the Service on behalf of a legal entity, that you are authorized to enter into a binding agreement on behalf
                    of such legal entity) and that you accept the terms and conditions on behalf of the entire entity and are not banned from receiving the Service under the laws of any jurisdiction. You also agree to provide at all times correct, accurate, current,
                    and complete information about yourself.
                </div>

                <h4>
                    5. User Obligations and Undertakings
                </h4>
                <div>
                    You hereby agree and acknowledge that: (i) the Service is the proprietary, copyrighted works of SmartBull and comprise: (a) works of original authorship, including compiled information containing SmartBull’s selection, expression and arrangement of such
                    information or pre-existing material it has gathered or assembled; and (b) trade secret and other confidential information; and (ii) SmartBull has no control over the quality of the content posted, or the truth, completeness or accuracy of the
                    listings, and SmartBull makes no other representations about any of the content provided. You agree not to do any of the following, notwithstanding anything to the contrary contained herein: (i) copy, modify, adapt, translate or otherwise create
                    derivative works of the Service; (ii) reverse engineer, de-compile, disassemble or otherwise attempt to discover the source code of the Service; (iii) rent, lease, sell, sublicense, assign or otherwise transfer rights in or to the Service; (iv)
                    remove any proprietary notices or labels from the Service; (v) develop any other product or service containing any of the concepts and ideas contained in the Service or use the Service for the purpose of building a similar or competitive product;
                    and (vi) remove, obscure, or alter any notice of copyright, SmartBull's Marks (as such term is defined below), or other proprietary right appearing in or on any item included with the Service. You represent and warrant that SmartBull is permitted
                    to access, preserve, or disclose your account information if required to do so by law or in a good faith belief that such access preservation or disclosure is reasonably necessary to: (i) comply with legal process; (ii) enforce the Terms of Service;
                    (iii) respond to your requests for customer service; (iv) protect the rights, property or personal safety of SmartBull, its users and the public; or (v) enhance the Service provided to you.
                </div>

                <h4>
                    6. Fees.
                </h4>
                <div>
                    In consideration for the Service, Cusomter shall pay SmartBull the fees agreed upon between the You and SmartBull (the “Fees”). Unless otherwise explicitly detailed in these Terms of Service, all amounts owed to SmartBull are non-cancellable and the Fees
                    paid are non-refundable. SmartBull will invoice for the Service as set forth in the applicable ordering document, and each invoice will be paid via bank wires, checks, or other methods made available by SmartBull, within thirty (30) days from
                    the date of the invoice.
                </div>

                <h4>
                    7. Indemnity for use of Services:
                </h4>
                <div>
                    You shall defend, indemnify and hold harmless SmartBull and its shareholders, directors, officers, employees, agents, representatives, affiliates, partners, subsidiaries, and licensors (collectively, “Indemnified Parties”) from and against any and all
                    alleged or actual damages, costs, liabilities, and fees (including without limitation reasonable attorney’s fees) that arise from or relate to any and all allegedor actual claims, actions, demands, causes of action and other proceedings (“Claims”)
                    arising out of or relating to your breach of these Terms of Service, including without limitation any breach of any representation or warranty contained in these Terms of Service. The Indemnified Parties will have the right, but not the obligation,
                    to participate through counsel of their choice in any defense by you of any Claim for which you are required to defend, indemnify or hold harmless the Indemnified Parties (“Indemnified Claim”), provided that your obligation to pay SmartBull’s
                    attorney’s fees shall only extend to SmartBull’s reasonable attorney’s fees. You may not settle any Indemnified Claim without the prior written consent of the concerned Indemnified Parties.
                </div>

                <h4>
                    8. Proprietary Rights of SmartBull
                </h4>
                <div>
                    You acknowledge that the Service and any necessary software used for the purpose of supplying the Service (“Software”) may contain proprietary, registered, or classified information protected by intellectual proprietary laws and other applicable laws.
                    You further agree that all trademarks, brands names, service marks, and other SmartBull logos, trademarks features/advantages, products names, and Services are trademarks owned by SmartBull (“SmartBull Marks”), and you agree not to present or
                    use SmartBull Marks in any way without prior permission.
                </div>

                <h4>
                    9. Disclaimer of Warranties; Limitation of Liability
                </h4>
                <div>
                    You understand and agree that the Service is provided on an “As Is” and “As Available” basis. To the fullest extent permissible pursuant to applicable law, SmartBull disclaims all warranties of any kind, express or implied, including, without limitation,
                    implied warranties of title or non-infringement, accuracy, completeness, merchantability, and fitness for a particular purpose of the Service. SmartBull does not warrant: (a) that the Service provided to you will meet your requirements or expectations;
                    (b) that the use of the Service will be uninterrupted; or (c) that defects in the Service, if any, will be corrected. The foregoing exclusions and disclaimers are an essential part of these Terms of Service and form the basis for determining the
                    price charged for the Service. No Investment Advice. You hereby acknowledge and agree the provision of the Service is not intended to establish, and shall not establish, an investment advisory relationship among you and SmartBull, or any of SmartBull’s
                    shareholders, directors, officers, employees, agents, representatives, affiliates, partners, subsidiaries, and licensors. Furthermore, you acknowledge and agree that you are not relying upon SmartBull or the Service for investment advice, analysis
                    or recommendations regarding any investment or potential investment. You further agree and acknowledge that all information or materials presented or released through the Service were, to the best of SmartBull's knowledge, timely and accurate
                    when issued. However, the passage of time can render information stale, and you should not rely on the continued accuracy of any such material beyond the date of issuance. Smartbull has no responsibility to update any information contained in
                    any such material. You expressly acknowledge and agree that SmartBull, its subsidiaries, associated companies, administrators, employees, agents, associates, and licensees are not responsible for any punitive, indirect, incidental, special/personal,
                    collateral, consequential, or cautionary damages, including but not limited to, loss of profit, good faith, use, data, or other intangible damages (even if SmartBull was informed of the possibility of these damages). In no event will the aggregate
                    liability of SmartBull for any and all claims arising out of or related to these Terms of Service exceed the fees paid to SmartBull for the Service during the three months period prior to the date a claim is made. The existence of one or more
                    claims shall not enlarge the limit. The parties agree that this limitation of liability represents a reasonable allocation of risk.
                </div>

                <h4>
                    10. Term and Termination
                </h4>
                <div>
                    Term. These Terms of Service shall commence on your first use of the Service and shall continue until the earlier of (i) termination by either party as set forth below, or (ii) the expiration of all subscription terms as those are specified in the ordering
                    document executed by both Parties. Termination by Customer: You may cease using the Service at any time, provided however, that upon any such termination of the Service, you will not be entitled to any refund of Fees previously paid, and such
                    termination of the Service will not release you from your obligation to pay all Fees, and such Fees will be immediately due and payable in full, unless stated otherwise in your ordering document. Termination by SmartBull: SmartBull may terminate
                    these Terms of Service, in any case of a material breach (including non-payment of Fees) of these Terms of Service and/or any applicable law, which has not been cured by within thirty (30) days following a written notice thereof from SmartBull.
                </div>

                <h4>
                    11. Survival
                </h4>
                <div>
                    Termination of these Terms shall not affect either of the Parties’ accrued rights or liabilities, or affect the coming into force or the continuance in force of any provision which is expressly or by implication intended to come into or continue in force
                    on or after such termination, including but not limited to: ‎5, ‎‎7, 8, 9 ‎10, 13 and 14.
                </div>

                <h4>
                    12. Notices:
                </h4>
                <div>
                    We may provide you with notices, including changes to Terms of Service notices, including but not limited to, through e-mail, regular mail, short text messages, multimedia messages, text messages, publications on web pages, products, notices through services,
                    or other reasonable means. You may not be given these notices if you violate these Terms of Service by accessing the Service in an unauthorized manner. By accepting these Terms of Service, you agree that you will be considered to have received
                    any and all of the notices that were supposed to be given to you if you accessed the Service in an authorized manner.
                </div>

                <h4>
                    13. General information:
                </h4>
                <div>
                    Full agreement. These Terms of Service and any other documents referred to herein form the full agreement between you and us. It governs your use of the Service, and replaces any previous version of these Terms of Service between you and SmartBull regarding
                    the Services. Your use may also be subject to additional terms and conditions that may apply when you use or purchase other specific services or the contents of a third party. Governing Law and Venue. You and SmartBull hereby agree that these
                    Terms of Service and the relationship between the parties are subject to the laws of the State of Israel, apart from provisions of conflict of laws, and that any of and all claims or causes of litigation or disputes arising out of or about Terms
                    of Service, or the relationship between you and SmartBull, shall be brought exclusively before the competent courts of the Tel Aviv – Jaffa District, and you agree to waive any and all objections regarding forum non-convenience. No Waiver; Severability.
                    SmartBull’s failure to practice or implement any right or provision of these Terms of Service does not mean SmartBull waives such right or provision. If any provision of these Terms of Service is, for any reason, held to be invalid or unenforceable,
                    the other provisions of these Terms of Service will remain enforceable and the invalid or unenforceable provision will be deemed modified so that it is valid and enforceable to the maximum extent permitted by law. Amendment. We may change these
                    Terms of Service at any time and without informing you of such change. Your continued use thereof shall be deemed acceptance of the amended Terms of Service, provided that prior to your continued access and use of the Service (following such change
                    to these Terms of Services) you have been informed of such change and elected to continue to use the Service. No Assignment. You agree that your account at SmartBull is non-transferable and may not be assigned by you to any third party. SmartBull
                    shall be entitled to assign its responsibilities hereunder in its sole discretion.
                </div>

                {!this.props.readonly && (
                    <div>
                        <br/>
                        <div className="text-center">
                            <input id="read-and-approve" type="checkbox" name="read-and-approve" style={{marginight:'5px'}}
                                   onChange={this.onEulaApproveCheckChange} value={this.state.eulaApproveChecked}
                            />
                            <label htmlFor="#read-and-approve">I have read and agree to the above Terms of Service</label>
                        </div>
                        <br/>
                        <button className="btn btn-success btn-lg col-md-2 col-md-offset-5"
                                disabled={!this.state.eulaApproveChecked}
                                id="sign-eula"
                                onClick={this.onEulaSignedClicked}
                        >Approve</button>
                        <br/>
                    </div>
                )}

            </div>
        )
    }
}

export {Eula};
