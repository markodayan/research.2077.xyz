---
title: "EIPs For Nerds #1: ERC-7512 (On-Chain Representation For Security Audits)"
pubDate: December 5, 2023
author: Emmanuel Awosika
authorTwitterHandle: eawosikaa
tags:
  - Infrastructure
  - Layer1
imgUrl: '../../assets/EIPsForNerds1-ERC-7512(On-ChainRepresentationForSecurityAudits).webp'
description: '"Decentralize X and put it on the blockchain" has never sounded so good.'
layout: '../../layouts/BlogPost.astro'
---
![image](../../assets/EIPsForNerds1-ERC-7512(On-ChainRepresentationForSecurityAudits).webp)

Imagine this scenario: you're playing *Who Wants To Be A Millionaire?* and a million-dollar question comes up: "What event has represented the biggest existential threat to Ethereum in the network's history?"

What would your answer be?

The (in)famous Red Wedding? The 2016 Shanghai DoS attacks? The CryptoKitties fiasco? The "unannounced" hard fork? Picking any of these options would seem reasonable—after all, these events were significant enough to warrant widespread attention from the community—but winning the prize requires choosing a far simpler option. Something as simple as the bug that led to the DAO hack.

Chew on that for a second: a critical consensus bug that split the blockchain in two didn't come close to threatening Ethereum's future as much as a vulnerability affecting *one* contract out of the thousands deployed on the network. Of course, the rules are probably different if said contract happened to hold ⅓ of all ETH in circulation—but you get the idea.

The DAO hack also underscored the importance of smart contract security to [Ethereum's future](https://ethereum2077.substack.com/p/announcing-ethereum-2077-newsletter) as a platform for coordinating economic activities on a global scale. This in turn motivated a diverse group of professionals within the Ethereum community to dedicate more attention to the problem of securing applications running in a distributed (and potentially adversarial) computing environment like the Ethereum Virtual Machine ([some even credit the DAO hack for birthing the blockchain security industry](https://www.coindesk.com/video/how-the-dao-hack-back-in-2016-changed-ethereum-and-crypto-forever/)).

But there are still problems that need to be solved.

For example, independent, third-party reviews of smart contract code by security professionals, a.k.a., "audits", have become commonplace; however, the current approach to verifying audits faces various problems—limiting the usefulness of audits as a tool for assessing a contract's security. ERC-7512 is a new Ethereum Improvement Proposal (EIP) that proposes to fix this particular problem by creating a standardized approach to publishing audit reports on-chain and the focus of this article.

## Setting the stage: Why are audits (and audit information) critical to blockchain security? 

Thanks to the efforts of various individuals and teams in Ethereum's security community, the amount of security tooling available to developers for building secure dapps—from testing frameworks to formal verification tools and battle-tested libraries—has increased in recent years. But audits still represent a critical part of the smart contract security stack for specific reasons:

- Finding certain bugs requires a human (i.e., the auditor), capable of understanding another human's (i.e., the developer) intention for a particular piece of code, to compare the contract's execution with the original intention (with any discrepancies in a contract's specification and runtime behavior representing a potential vulnerability).

- Hackers aren't AI agents (yet), so auditors—in their role as security reviewers—can make informed guesses about strategies a prospective attacker might adopt and propose measures and mitigations developers can implement to defend DeFi protocols against previously identified attack vectors.

- Auditors (unlike tools) have skin-in-the-game and will (ideally) work closely with development teams to ensure smart contracts meet minimum requirements for safety and implement best practices for security before a project's mainnet launch (no auditor wants to see Rekt anons associate their company with a project that suffered a hack)

This is why—compared to pre-2016 Ethereum—commissioning an audit is considered a standard requirement for gaining users' trust; it's also the reason blockchain security has become a lucrative industry today. Even with such progress, problems remain in the following areas:

- Assessing the quality of smart contract audits (e.g., "what things should an audit check in a smart contract?");
- Standardizing approaches to communicating details of audit engagements with third-parties (e.g., "what counts as a severe vulnerability?");
- Verifying information about auditors' engagement with clients (e.g., "who audited this contract and when did they audit it?"), etc.

The first two problems have social dynamics, making them hard to solve, but the third problem is (surprisingly) tractable—especially if we leverage the blockchain for immutability and transparency of data. This is what [ERC-7512](https://eips.ethereum.org/EIPS/eip-7512) attempts to do by providing a uniform approach to verifying information about smart contract audits _on the blockchain_.

The last bit is critical: you could always verify the details of an audit by checking through the PDF report on the auditor's website, or consulting other off-chain sources for any information regarding a protocol's audit (e.g., Etherscan includes audit information for token contracts). However, this approach (manual (off-chain) verification of audits) runs into several issues:

1. **Audit data is centralized**: Whether the audit report is uploaded to a GitHub/GitLab repository, or stored on company servers, it can be deleted, or altered. It can also be erased permanently and rendered unavailable to individuals that need the information to make (informed) assessments of a protocol's security before interacting with it.

It's possible to decentralize storage of audit information by storing audit data with third-party platforms—for example, CoinMarketCap, CoinGecko, and Etherscan display audits for select token contracts listed on those platforms based on data from auditors. But such schemes are still _too_ centralized: you need to trust the platform to keep the information around and, often, only audits from partner auditors are displayed on the aforementioned websites.

2. **Manual verification of audit information is cumbersome**: After digging through a project's documentation and finding a link to the audit report—and that didn't lead you to a 404 page—you still have to verify that the audited contract is the same as the contract deployed on the blockchain. There are efforts to make [source code verification](https://ethereum.org/en/developers/docs/smart-contracts/verifying/) easier, but doing this still requires a non-trivial amount of effort and makes DYOR (Do Your Own Research) a difficult task for both users and protocol teams.

Putting audit reports on-chain won't exactly solve DeFi's security problem (and this is a subtle but crucial consideration related to this ERC), but it _can_ solve the aforementioned problems— and, in the process, increase transparency and bolster user confidence in the safety of various smart contracts. In the next sections, I'll dive into the technical details of ERC-7512 before touching on the importance of this proposal to the Ethereum ecosystem.

![image](./images/eip1.webp)

## An overview of ERC-7512: On-chain audit representation

This section provides a high-level overview of ERC-7512's technical details; note that (a) The ERC is in the draft stage, and so details may change (I'll encourage tracking changes to the EIP via the EIP website or [Ethereum Magicians forum](https://ethereum-magicians.org/t/erc-7512-onchain-audit-representation/15683/1)) (b) The overview has a simple scope—for more technically-inclined readers interested in more details, the ERC document provides more comprehensive technical specs for ERC-7512.

For a quick overview: ERC-7512 is a standard for creating on-chain, verifiable representations of audit reports that external contracts can parse to extract specific information about a contract's audit procedure, such as the auditors that contributed to the audit and the list of ERC standards supported. ERC-7512 doesn't declare a particular interface or function for extracting audit data and instead allows developers to implement bespoke schemes for retrieving information from on-chain audits.

Here's a high-level description of the structure of an on-chain audit representation as defined by ERC-7512:

## Auditor

The **Auditor** data type provides information about the entity behind a contract's audit, and includes the following values: **name** (name of the auditor), **uri** (a URI ([Uniform Resource Identifier](https://en.wikipedia.org/wiki/Uniform_Resource_Identifier)) in this scheme provides more information about the audit company; URIs can include a human-readable link to the auditor's website, for example), and **authors** (a list of individuals that contributed to a contract's audit—if more than one person audited the contract).

## AuditSummary

The **AuditSummary** data type summarizes key information about the audit and includes the following values: **auditor** (information about the auditor), **auditedContract** (the contract instance referenced in the audit), **issuedAt** (the date of the audit's release identified by **auditHash**), `ercs`(a list of ERCs, e.g., ERC-20 and ERC-721, implemented by the audited contract), **auditHash** (a hash of the original audit report), and **auditUri** (a URI pointing to the location from which the original audit report can be retrieved).

## Contract

The **Contract** data type in an ERC-7512-style audit representation includes a **chainID** (a 32-byte representation of the **chainID** based on [EIP-155](https://eips.ethereum.org/EIPS/eip-155)) and a **deployment** address (the address where the bytecode for the audited contract is deployed). ERC-7512 includes **chainID** in the audit information since the behavior of a contract can differ on different (EVM) blockchains—even if the same code is used in both instances.

<div class="hr"></div>


ERC-7512 can represent all of the above information in a structured and meaningful way by integrating with [EIP-712](https://eips.ethereum.org/EIPS/eip-712) (which provides a way of signing structured data like enums and structs and verifying the signer's identity); specifically, it allows an auditor (represented by their public key) to sign a digest containing details of the audit off-chain and for a third-party (e.g., a user or protocol) to verify the authenticity of the signature on-chain in the EVM.

However, EIP-712 only supports verifying signatures from EOAs (Externally Owned Accounts). To account for audit companies using a smart contract wallet—for example, because it enables multisignature approvals—ERC-7512 provides additional support for attaching [EIP-1271](https://eips.ethereum.org/EIPS/eip-1271) signatures to audit summaries.

## Why ERC-7512? The case for on-chain verification of smart contract audits 

The key idea underpinning ERC-7512's design is simple (and before you think, "why didn't anyone think of it before?", others have tried to [implement similar schemes with less success](https://ethereum-magicians.org/t/erc-7512-onchain-audit-representation/15683/18); let's hope things play out differently this time): once an auditor provides a signed audit to the client project, interested parties can directly and automatically verify a contract's audit status on-chain by validating the authenticity of the auditor's signature on-chain.

Unlike the status quo, where the audit report sits off-chain and the code is on-chain, ERC-7512 moves verification of audits closer to the blockchain. And thanks to the magic of [public-key infrastructure](https://www.techtarget.com/searchsecurity/definition/PKI), it's possible to make the verification resistant to certain types of fraud, such as impersonation and forgery of audit reports (this assumes auditors have proper key management practices in place to prevent unauthorized signing of on-chain audits).

So, how might this work in practice?

The authors of ERC-7512 have (fortunately) provided an example to demonstrate one application of the standard: verifying ERC compatibility before integrating tokens with a bridge. Here's a diagram representing the interaction between the "user" (responsible for providing signed audit for verification), "bridge operator" (responsible for verifying token contract audit), and "verifier" (a smart contract that verifies the signature extracted from the hash of the signed audit and checks specific security-related information from the audit report):

![image](./images/eip1-2.webp)

- The **user** in the diagram is bridging tokens for the first time and passes the audit report to the **bridge operator**. The **bridge operator** is assumed to have registered a list of public keys associated with "trusted" auditors in the verifier contract. The **verifier** is a contract that checks whether a new token is eligible for bridging (per rules defined by the bridge operator)
- The **verifier** contract checks that (a) the audit is signed by a trusted auditor and (b) the audited contract implements the required ERC(s) (ERC-1115 in this example); this can be done by checking the **ercs** section of the audit summary digest. If the audit check passes, the **bridge operator** can now proceed to (manually) provide permission to bridge the new token.

This is a simple example, but it exemplifies the value of ERC-7512 to protocols sitting at Ethereum's application layer—especially if you consider how many exploits have occurred after a bridge integrated with token contracts that display unintended behavior on interactions (see "[_Weird ERC-20 tokens_](https://github.com/d-xo/weird-erc20)" for an example). I've [previously described composability](https://businesstechguides.co/why-composability-matters-for-web3)—including the ability for tokens on Ethereum to interoperate seamlessly—as one of Ethereum's killer features, but that comes with the risk of flawed interactions between contracts producing security vulnerabilities (as we've seen [happen in the past](https://research.openzeppelin.com/compound-tusd-integration-issue-retrospective)).

The alternative would be to simply block all interactions with tokens that haven't passed due diligence (conducted by the protocol's in-house team); however, this only introduces centralization and could break functionality that relies on the assumption that tokens will remain interoperable across applications and infrastructure without constraints. ERC-7512 eliminates the need to make this tradeoff by providing an easy way to verify adherence to ERC specifications in token contracts and acts as a pluggable module bridges can integrate into their security infrastructure.

One might also see how ERC-7512 can be useful to a broader class of applications:

- A DEX may want to verify that a new token doesn't implement ERC-777 style hooks (which have [enabled reentrancy attacks previously](https://research.blockmagnates.com/detailed-explanation-of-uniswaps-erc777-re-entry-risk-8fa5b3738e08)) before creating a liquidity pool with that asset as one-half of a tradeable pair.

- Wallet applications like MetaMask and Coinbase Wallet may verify a token's audit before permitting swaps involving that token; an extension would be displaying an "audited" or "unaudited" label directly to users at the time of interacting with a token—effectively reducing the difficulty of conducting due diligence (sidenote:[TrustBlock](https://trustblock.run/) provides a similar service, with the caveat that it operates as a proprietary product and wallet developers will have to integrate the platform's API to use audit data stored by TrustBlock).

## Alternatives to ERC-7512

Some (see [here](https://ethereum-magicians.org/t/erc-7512-onchain-audit-representation/15683/3),[here](https://ethereum-magicians.org/t/erc-7512-onchain-audit-representation/15683/7), and [here](https://ethereum-magicians.org/t/erc-7512-onchain-audit-representation/15683/19)) have proposed an on-chain registry for auditors as an alternative to ERC-7512; here, (note that I'm oversimplifying the concept):

- A registry contract is deployed and auditors can register public keys in the registry (for third-party verification purposes)—or follow some admission process determined by the registry owner.

- Auditors can generate a signed non-fungible token (NFT) with information about the audit of a particular contract (e.g., no. of vulnerabilities found by auditors (ranked by severity) and a link to the audit report)included in the NFT metadata.

- Anyone can verify the audit NFT by recovering the public key from the signed NFT and cross-checking with the list of keys stored in the public registry contract. Ideally, the NFT would be a [soulbound token](https://www.coindesk.com/learn/what-are-soulbound-tokens-the-non-transferrable-nft-explained/) (SBT) to prevent transfers (which would make it harder to verify provenance).

An on-chain registry would free protocols from the burden of registering trusted auditor keys per ERC-7512's specification; however, this trades off ease of use for more complexity—plus there's the risk of one or more registry owners attempting to control how audit information is represented on-chain (which may lead to different, conflicting representations of audits and causing more headache for developers). The other risk is centralization: the extent to which certain audits can be verified on-chain depends on auditors' admission to the registry.

In contrast, ERC-7512 ensures consistency in verification of audits across the ecosystem by standardizing the structure of on-chain audit representations (this also helps with decentralization because it allows _any_ auditor to create verifiable audits without relying on a particular registry). ERC-7512's simplicity also makes it more flexible and adaptable to different usages—for example, a signed audit summary can be used to generate soulbound tokens (SBTs) whose provenance can be verified against a public key stored in another registry. Also, a registry contract can also require ERC-7512-style on-chain audit representations from audit companies before adding them to the registry.

## Analyzing ERC-7512’s limitations

Like every proposal, ERC-7512 is not without weaknesses—some of these are fairly obvious and straightforward, while others are more nuanced. I'll provide a brief rundown here, but you can see this article and the discussion on Ethereum Magicians for more details:

**1.** The ERC-7512 proposal document adds a disclaimer that on-chain audits should not be seen as an attestation to a contract's security and instead only a way to know if a contract has been audited or not. This is quite sensible; but if we've learned anything, it's that projects will use everything as leverage for marketing, including the possession of an on-chain audit (even though "audited" ≠ "free from bugs").

ERC-7512's design (driven by the need for simplicity) also complicates the problem: information about security issues discovered by auditors (i.e., findings) isn't referenced in the audit summary; to get this information, users would need to find the audit report itself—reintroducing the problem of relying on centralized (off-chain) infrastructure to store audit information.

While the intention is commendable, missing out on critical information like vulnerability findings may lower the value of the proposed scheme to represent audits on-chain. See the comment below from the discussion of ERC-7512 (by [Dexaran](https://ethereum-magicians.org/u/Dexaran)) for context:

> _"The current ERC does not have any mentions of the findings of an audit...This is the most crucial part honestly. There can be multiple audit reports for one contract and if at least one indicates a problem with the contract - it is more important than all other reports that do not indicate any problems with this exact contract._
> 
> _If you have 3 auditors who have reviewed one contract, two of them found nothing and the third found a critical vulnerability - it's much more logical to indicate that "the contract might have a critical vulnerability" rather than resort to an assumption "if there is at least one audit report that doesn't indicate any problems then the contract is most likely safe"._
> 
> _I think that a system that does not allow for findings specification and independent audits submissions for multiple different auditors - will not work or even worse it will deceive users into thinking that some contract is secure while in fact there are problems with it." — u/Dexeran_

**2.** The initial version of ERC-7512 tries to create visible connections between audits and the smart contracts covered by auditors by including a **deployment** value in the **AuditSummary** data type that points to the deployment address for the audited contract. This way, protocols don't have to go through a roundabout process of copy-pasting contract addresses from a PDF and searching for the relevant contract address via blockchain explorers like Etherscan.

However, the popularity of "proxy contracts" presents a small wrinkle to ERC-7512's approach to verifying smart contract audits. For the uninitiated, a proxy contract delegates the execution of one or more functions to another contract instead of executing the logic itself (using Solidity's **DELEGATECALL** feature); the main use case for proxy contracts is to enable contract upgrades without needing to migrate old state or deploy a new contract and initialize a new state.

The trick is to (a) separate a dapp's state and logic into separate contracts: a proxy contract that holds the state (e.g., user balances) and an implementation contract that stores the dapp's logic and (b) store a pointer to the implementation's address in the proxy (which is how the proxy forwards function calls during execution). If a developer wants to upgrade dapp and modify its logic, it's only necessary to point the proxy to a new implementation contract.

While proxy patterns used to be simpler (one proxy contract and one implementation contract at any point in time), newer patterns—especially the [Diamond Pattern](https://medium.com/@MarqyMarq/how-to-implement-the-diamond-standard-69e87dae44e6)—allow contracts to point to any number of implementation contracts. Here's a handy graphic showing the interaction between contracts in in a proxy pattern (you can [read the article](https://research.openzeppelin.com/proxy-patterns) for a more comprehensive introduction to proxy upgrades):

![image](./images/eip1-3.webp)

If I haven't lost you with developer-speak, then perhaps you already see the problem: if the audited contract is a proxy, an ERC-7512-style on-chain audit won't exactly assure external verifiers of the contract's safety since the actual code executed when users call the proxy's functions—and which will be the source of any serious vulnerability—is stored at a separate address. For ERC-7512 to be useful in this scenario, there has to be an additional piece of data in the audit summary to show that the proxy and any implementation(s) it uses at runtime have passed an audit.

Fortunately, the authors of ERC-7512 have started work on adding support for proxies as the [latest pull request to edit the ERC proposal on GitHub](https://github.com/OnchainAudit/EIPs/pull/2) shows. Even so, given the complexity of proxies, there might be some more wrinkles to work out to make validating audit information for contract proxies easier and more secure. [This article](https://medium.com/rektoff/an-in-depth-analysis-of-erc-7512-onchain-representation-for-security-reviews-aa1121839ff3) by Gregory Makodzeba—which does an amazing job of exploring ERC-7512 from an auditor's perspective— has some insights on the challenges of adopting ERC-7512 to support proxies and is worth reading.

![image](./images/eip1-4.webp)

**3.** ERC-7512 proposes that a third-party verifier should register the public key associated with a "trusted auditor" before validating the authenticity of an audit report. I've explained why authenticating auditor identities this way is valuable, and won't go into details here; the part that's important to a discussion of ERC-7512's limitations is the "trusted" part. The ERC document doesn't mention details about how an audit company will receive a "trusted auditor" classification, but it's easy to think that protocols will likely consider audit companies with a positive track record and robust reputations in the industry.

This is all well and good—if anything, the appeal of publishing audit reports publicly is to motivate auditors to deliver high-quality security reviews to avoid a loss of reputation if an audited protocol is hacked. The issue, however, is that restricting "trusted auditor" status to only a few, high-profile names may raise the barrier for new entrants.

This approach can introduce a new set of problems, such as reducing or removing the incentive for established audit companies to improve service deliveries due to competition from new players. The previously linked article by Gregory Makodzeba proposes a "democratic" mechanism where individuals can vote to add audit companies to a registry of trusted auditors, but whether this is viable or not is an open question.

**4.** The final—and perhaps most important—concern not addressed by ERC-7512 in its current form is how to deal with issues that affect a smart contract's security _after_ the audit. I'm not talking about new zero-day vulnerabilities here (though these _should_ be considered as well), but something like changes to a contract's code that changes the threat model and introduces new, unassessed attack vectors. Except the changed codebase is subject to additional reviews from the _same_ company that audited the original code (and no major vulnerabilities surface), it may be unfair to have auditors continue to vouch for the security of the contract in question.

This necessitates some mechanism that will allow auditors to potentially invalidate audits s based on new information, such as an (unaudited) contract upgrade (e.g., changing the proxy's implementation), changes in key parts of the system (e.g., new administrative controls), or any other issue that could invalidate security-related assumptions made by auditors during the initial audit. This way, auditors can balance the need for accountability with the need to protect business reputations, especially in an industry like security auditing where reputation is (nearly) everything.

## Final thoughts on ERC-7512 

Web3 security is a long game; things have certainly improved since the DAO hackbut new threats keep appearing (you can see [Blockthreat](https://newsletter.blockthreat.io/) and [Rekt](https://rekt.news/) for regular commentary), forcing auditors, projects, platforms, and other key players to evolve new defensive strategies. It is also an _important_ game: lack of trust is arguably one of the biggest factors hindering crypto's mass adoption; for web3 to reach scale, users need confidence in the security of the applications they're interacting with, and projects need to assess external protocols' security guarantees to avoid the negative aspects of composability.

ERC-7512 moves us a step closer to building trust in on-chain applications and may inspire more efforts to standardize other aspects of the security review process. For instance, given projects now increasingly adopt a "defense-in-depth" approach to protocol security—bug bounties, formal verification, audit contests, incident monitoring, and more—a system that aggregates (verifiable) information about a project's various security measures in the same location (as opposed to this information being fragmented across multiple websites and dashboards) would do wonders for investors, users, business development (BD) teams conducting due diligence for DeFi protocols. ([DeFi Safety](https://defisafety.com/about) used to have a similar service but recently switched to a revenue model.).

As mentioned previously, ERC-7512 is still in draft stage, and may see more changes before a final version is proposed for adoption as an Ethereum standard; in the meantime, you can follow the conversation around the proposal on [Ethereum Magicians](https://ethereum-magicians.org/t/erc-7512-onchain-audit-representation/15683/1) and the [ERC-7512 Telegram group](https://t.me/OnchainAudit). Finally, don't forget to subscribe to Ethereum 2077 for more EIP guides; and if you found this article informative, do share it with someone you think would appreciate it.
