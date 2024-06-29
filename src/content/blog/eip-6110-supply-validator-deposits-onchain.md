---
title: eip-6110-supply-validator-deposits-onchain
pubDate: 06/28/2024
author: Emmanuel Awosika
authorTwitterHandle: eawosikaa
tags:
  - Defi
imgUrl: '../../assets/EIPs For Nerds  4- EIP-6110 (Supply Validator Deposits On-Chain).webp'
description: 'Sending ETH from Ethereum execution layer to the consensus layer'
layout: '../../layouts/BlogPost.astro'
---
The Beacon Chain has undergone a lot of changes since the Merge: a testament to an idea I described in the last article—with a complex, evolving protocol like the Beacon Chain, the work is never done and developers will _always_have something to fix. For context, the EIPs For Nerds series has covered two proposals that fix key issues : security of delegated staking ([EIP-7002](https://ethereum2077.substack.com/p/eip-7002-execution-layer-exits)) and unchecked validator set growth ([EIP-7251](https://ethereum2077.substack.com/p/eip-7251-increase-max-effective-balance)).

Keeping up with the theme of discussing upgrades to Ethereum's consensus layer, the next article in the EIPs For Nerds series focuses on EIP-6110. [EIP-6110: Supply Validator Deposits On-Chain](https://eips.ethereum.org/EIPS/eip-6110)is an Ethereum Improvement Proposal (EIP) that reforms the Beacon Chain's validator deposit mechanism and fixes a laundry list of issues currently affecting the security and efficiency of Ethereum's Proof of Stake protocol. These issues, which I'll go into later, stem from the reliance of deposit processing on the **Eth1-Eth2 bridge**.

The Eth1-Eth2 bridge is a "one-way" bridge that allows for sending ETH from Ethereum's execution layer to the consensus layer. Often described as the most secure bridge in the world, the Eth1-Eth2 bridge plays a critical role in the Beacon Chain's operation and serves as the entry point for anyone interested in participating in Ethereum's consensus. More specifically, it creates a link between Ethereum's execution and consensus layers and enables processing of collateral deposits from prospective validators on Ethereum.

Notwithstanding its lofty description, the Eth1-Eth2 bridge is still susceptible to issues that plague most bridges today—poor security, low efficiency, and high engineering complexity. These problems stem from the Eth1-Eth2 bridge's approach to validating and processing deposits, which I'll explore in subsequent sections of this article..

EIP-6110 remedies the problem by deprecating the Eth1-Eth2 bridge and introducing a new means of delivering validator deposits to the Beacon Chain. This article provides a comprehensive overview of EIP-6110 and establishes the background for the proposed overhaul of the Beacon Chain's deposit processing system. I'll also dive into the specification and discuss the various advantages and potential drawbacks of implementing EIP-6110's in-protocol deposits feature.

Let's dive in!

The Eth1-Eth2 bridge has proven to be a secure means of passing information about deposits between Ethereum's layers, but runs into several issues—such as the requirement for a delay on deposit processing and increased complexity for validators operating the bridge. But, before we start analyzing these issues in more detail, it is necessary to understand _why_the Eth1-Eth2 bridge exists in the first place.

A one-way bridge for transferring assets (ETH deposited in the deposit contract) from the execution layer to the consensus layer was necessary before the Merge because the execution layer (fka "Ethereum 1.0") and the consensus layer (fka "Ethereum 2.0") were distinct blockchains operating independently. The Eth1 chain was a Proof of Work-based chain secured by miners, while Eth2 was a Proof of Stake chain secured by validators. Having a different set of consensus nodes for each chain had a number of implications; for example, the Eth2 chain couldn't operate based on information about the state of the Eth1 chain without introducing trust assumptions.

As I mentioned in [EIPs For Nerds #2: EIP-7002](https://ethereum2077.substack.com/i/140493297/reduced-trust-assumptions-in-delegated-staking), "trustlessness" means "you don't have to trust people to avoid dishonest behavior because there are strong (cryptoeconomic) incentives to act honestly." Proof of Stake protocols like the Beacon Chain incentivize honest behavior by requiring each validator to pledge collateral before joining the consensus protocol. If some validators act dishonestly while participating in consensus, the protocol can identify and destroy the collateral of the offending validators.

This is possible because (a) The Beacon Chain has control of balances of validators participating in the protocol and can reduce this balance as punishment for bad behavior (with certain caveats), and (b) The Beacon Chain stores a mapping of validators' public keys that creates a cryptographic link between validators' actions in the protocol and enables the protocol to efficiently identify offenders. All of this means validators on the Beacon Chain can be (mostly) trusted to attest to correct information while participating in the protocol.

In contrast, the miners running the Eth1 chain couldn't be trusted to provide correct information about the Eth1 chain's state to validators running the Eth2 chain. An example of "Eth1 state" the Eth2 (Beacon) chain needed—but couldn't trustlessly access—was information about transactions sent to the Deposit Contract deployed on the Eth1 chain. For the uninitiated, the [deposit contract](https://etherscan.io/address/0x00000000219ab540356cbb839cbe05303d7705fa)is a system-level smart contract deployed on Ethereum's execution layer and has two functions:

* Receive and validate deposits from anyone that wants to activate a new validator, or top up the balance of an existing validator, on the Beacon Chain.

* Emit a deposit receipt using the EVM's event logging mechanism. The deposit receipt provides a record that the deposit occurred.

The deposit contract stores information associated with deposits in a Merkle tree structure called an [Incremental Merkle Tree](https://zokyo-auditing-tutorials.gitbook.io/zokyo-tutorials/tutorial-16-zero-knowledge-zk/definitions-and-essentials/incremental-merkle-tree). The Incremental Merkle Tree behaves like a regular Merkle tree (_ [Verkle Trees For The Rest Of Us](https://ethereum2077.substack.com/p/verkle-trees-for-the-rest-of-us-part-1)_has a reader-friendly introduction to Merkle trees), except for certain optimizations that make it useful for storing and updating information. For example, the deposit contract stores only one branch (a set of 32 leaves) necessary to calculate the root and avoids storing all leaf nodes on-chain—which reduces the costs of storing and updating elements in the tree. (_Upgrading Ethereum_has a [great overview of the deposit contract's tree structure](https://eth2book.info/capella/part2/deposits-withdrawals/contract/)for those interested).

Merkle trees have several nice properties, including the ability to prove (cryptographically) that a particular value is a part of a large set of data. The deposit contract creates a leaf in the Merkle tree for every deposit, which allows a validator to create a _Merkle proof_that proves the existence of a deposit a particular position in the deposit tree. The Merkle proof (also called a _Merkle branch_) is the set of leaf hashes required to compute the path from a leaf to the root of the Merkle tree.

As I explained in the Verkle trees article, the root is a succinct commitment to the tree's data, and anyone with the root can verify a Merkle proof asserting the inclusion of an element in the Merkle tree without storing the entire tree. In the original Eth1-Eth2 bridge design, proposers monitored the Eth1 chain for transactions sent to the deposit contract and delivered deposits to the Eth2 chain by including deposit operations in Beacon blocks. Proposers included Merkle proofs proving that deposit operations corresponded to leaves in the deposit tree—which validators verified before processing deposits.

The root of the deposit Merkle tree served as a "source of truth" for deposits made on the Eth1 chain, implying the security of the Eth1-Eth2 bridge depended (heavily) on the process for verifying the validity of the deposit tree root. If validators had the wrong deposit tree root, a malicious proposer could create Merkle proofs for non-existent deposits and activate new validators that failed to deposit the required collateral.

To secure the bridging of deposits from the Eth1 chain, a process—known as the **Eth1Data poll**—was created for the Beacon Chain to arrive at a consensus on the root of deposit tree. [Eth1Data](https://github.com/ethereum/annotated-spec/blob/master/phase0/beacon-chain.md#eth1data)represented the Beacon Chain's view of the execution layer, or more specifically, the state of the deposit contract at a particular block height. The Eth1Data poll, which I'll explore later, provided a way for the Eth2 chain to derive information about deposits without placing too much faith in the honesty of miners validating the Eth1 chain.

We couldn't trust miners on Eth1 chain to validate deposit transactions since miners weren't staked on the Beacon Chain and had weaker incentives to act honestly. Moreover, Proof of Work—unlike Proof of Stake—imposes an _implicit_cost on dishonest behavior like reverting past blocks and cannot reliably identify and punish dishonest consensus nodes. In other words, miners had nothing at stake and could jeopardize the Eth1-Eth2 bridge without incurring risk.

Here's an example to illustrate:

1. Suppose a Beacon block proposer receives the header of block #10000 from a miner that shows Alice depositing 32 ETH in the deposit contract (the validator pulls the deposit tree root from the block's state root). The block proposer, assured Alice's deposit is safely locked in the deposit contract, includes the deposit transaction in the proposed Beacon block. A majority of validators approve the block containing Alice's deposit—after which the protocol creates a new validator (with a balance of 32 ETH) for Alice.

2. Alice notices her validator's deposit has been created and bribes a mining pool with 51% of the network's [hashrate](https://www.coindesk.com/tech/2021/02/05/what-does-hashrate-mean-and-why-does-it-matter/)(total computational power contributed by miners) to create an alternative chain that discards the block containing the original deposit transaction. Now, Proof of Work chains have a longest-chain rule, where nodes are expected to follow the chain with most amount of "work" (i.e., computational power dedicated to solving the cryptographic puzzles required to find a valid block).

3. Creating a longer chain is trivial for the mining pool because it controls 51% of the computational power and has an outsized probability of winning the race to find the next block that extends the chain. The new chain (without Alice's deposit transaction) replaces the old chain (which includes Alice's deposit) as the canonical chain—erasing the record of Alice sending 32 ETH to the deposit contract from the chain's history.

4. Alice is now in a good position to eat her cake and have it. Her validator is already active on the Beacon Chain (with a withdrawable balance of 32 ETH), but the PoW chain shows her as having the 32 ETH she deposited to fund the validator. Alice can then "double-spend" her funds by creating a new deposit transaction and activating _another_validator with a balance of 32 ETH on the Beacon Chain.

5. The next proposer on the Beacon Chain requests the latest block header from a miner and receives the block containing Alice's second deposit transaction. The proposer (and indeed, the entire network) cannot discover the double-spend attack because it doesn't process blocks from the PoW chain. Specifically, the validator is a "light node" of the Eth1 chain: it can prove Alice made a deposit transaction by creating a [Merkle proof](https://ethereum2077.substack.com/i/139794043/a-gentle-introduction-to-vector-commitments-and-witnesses-in-merkle-trees)showing Alice's transaction is part of the block, but it cannot know if the block itself is valid (i.e., the block updates the blockchain's state correctly).

5. Once the protocol (inevitably) creates a new validator for Alice, she will have a withdrawable balance of 64 ETH on the Beacon Chain. Provided the amount of the bribe paid to the mining pool to execute the 51% attack is lower than Alice's withdrawable balance, the attack is profitable.

Note that the miners in this example don't suffer any punishment for building a chain that reverses transactions. If the majority of miners are honest and follow a minority chain that keeps Alice's transactions intact, the mining pool will have wasted computational resources on mining an alternative chain. The cost of adversarial behavior is _implied_; in contrast, Beacon Chain validators have an explicit financial cost to committing infractions: having their coins destroyed by the protocol. I describe this property (known as _accountable safety_) in [a section from EIPs For Nerds #3: EIP-7251 (Increase MAX_EFFECTIVE_BALANCE)](https://ethereum2077.substack.com/i/140556227/using-weight-based-rate-limiting-for-exit-and-deposit-queues).

This example shows why "trust a miner to give you trusted info about deposit transactions" was non-ideal for validators operating the Eth1-Eth2 bridge. It also highlights the importance of a secure mechanism for _securely_transmitting information about deposit transactions from the execution layer to the consensus layer. An ideal implementation of this mechanism will be secured by the Beacon Chain itself and avoid relying on the honesty of parties external to the protocol (e.g., miners)—which is why the Eth1Data poll exists today.

The Eth1Data poll is a process by which a committee of Beacon Chain proposers come to consensus on the state of the execution layer, especially the state of the validator deposit contract. The Eth1Data poll occurs over 2048 slots (`SLOTS_PER_ETH1_VOTING_PERIOD`), and requires a proposer participating in Eth1Data voting to include an `eth1_data`object—that represents its view of the execution chain's state—in a proposed block.

The Eth1Data included in a Beacon block comprises `block_hash`(the hash of an Eth1 block), `deposit_root`(the root of the deposit Merkle tree), and `deposit_count`(the total number of deposits in the deposit contract) and is a "vote" for the execution layer's state at a particular block height. The Beacon Chain uses uses a simple majority rule to decide the winner of the Eth1Data poll: an `eth1_data`must receive votes from more than half of proposers in the voting period (1024 or more) to win the poll:

* If a majority of proposers are in favor of one Eth1 state by the end of the Eth1Data voting period (i.e., 1/2 of proposers include the same `deposit_root`, `deposit_count`, and `block_hash`in proposed block), the deposit tree is finalized and Beacon Chain updates the value of `state.eth1_data`. Pending deposits included in the deposit tree at that time become eligible for processing (proposers create Merkle proofs to verify the inclusion of deposits in the deposit tree, which validators verify during the Beacon Chain's state transitions).

* If no Eth1Data receives enough votes to meet the required threshold, a new Eth1Data voting period starts at the beginning of the next epoch. Pending deposits cannot be processed and must wait until the majority of proposers are in a favor of one Eth1 state.

The security of the Eth1Data poll rests on the assumption that the majority of proposers (> ½) in the voting period are honest—that is, proposers include valid Eth1Data in blocks and vote for correct Eth1Data. A proposer isn't punished if it includes the wrong Eth1Data in a Beacon block, but the requirement to have at least half of the "voting committee" include the same set of `block_hash`, `deposit_root`, and `deposit_count`in blocks proposed during the voting period provides strong guarantees of security.

Having a large committee (2048 proposers) reduces the odds a single adversarial actor can gain control the majority of proposers during Eth1Data polling. Given a large validator set, the probability of an adversary-controlled validator getting selected to propose a block in 1024 slots (out of a total 2048 slots in the Eth1Data voting period) depends on the adversary's capacity to control a supermajority (⅔) of the validators' stakes. The infeasibility of one person owning 2/3 of staked ETH is the basis of the honest supermajority assumption (i.e., ⅔-n of staked validators are non-adversarial), which determines the security properties of the Eth1Data poll and the safety of the Eth1-Eth2 bridge.

The ⅔-n honesty assumption also underpins the Beacon Chain's security model; for example, an attempt to revert finalized blocks will result in the slashing of at least ⅓ of validators—provided the other ⅔ of validators are honest. Based on this analysis, the Eth1-Eth2 bridge has the semblance of being as secure as the core protocol. But this isn't the case, as we'll see in the next section analyzing the security weaknesses of the Eth1-Eth2 bridge.

Retrospective analysis of the Eth1Data poll has revealed weaknesses that allow an adversary controlling less than ⅔ (or 66%) of the active stake to compromise Eth1Data polling and exploit the Eth1-Eth2 bridge. We'll analyze some potential attack vectors in this part of the article:

An adversarial-controlled minority of validators of can prevent the Beacon Chain from reaching consensus during the Eth1Data poll by deliberately voting incorrect Eth1Data, or refusing to vote at all. Other (honest) proposers will ignore invalid Eth1Data, but the adversary can dilute committee votes such that no set of Eth1Data meets the required threshold (votes from 1024 proposers).

This is a _liveness failure_: the Beacon Chain cannot process pending deposits until another round of Eth1Data voting (lasting 2048 slots or ~8 hours) ends with a clear winner. If the adversary's validators continued to vote incorrectly and prevent the Beacon Chain from reaching consensus on Eth1Data, it can censor processing of deposits and prevent onboarding of new validators for as long as possible. Note that censoring deposits is economically rational from a validator's perspective since the total rewards accruing to each validator reduces as the validator set grows.

> _Another factor to consider regarding GRR [Gross Rewards Rate] fluctuation is validator dilution. The more validators contribute to the network, the more staking rewards are diluted among them, as validators are less likely to be chosen as block proposers. With currently almost 500k active validators on the Beacon Chain, the current consensus layer staking yield is 4.16%. With 800k validators, that number falls to 3.29%. —_Emmanuel Nalepa _([PoS Ethereum Staking Rewards: A Deep Dive](https://www.kiln.fi/post/pos-ethereum-staking-rewards-a-deep-dive))_

An adversary with close to half (47%) of the total validator stake can exploit the Eth1-Eth2 bridge by finalizing invalid Eth1Data. Finalization of Eth1Data requires the block that updates `state.eth1data`with the set of `block_hash`, `deposit_root`, and `deposit_count`is confirmed by a supermajority of validators over two epochs. This is a key part of the deposit processing mechanism that provides security: validators are expected to maintain a connection to an execution (Eth1) node and verify that `deposit_root`, `deposit_count`, and `block_hash`belong to a block included in the canonical Eth1 chain.

If an invalid deposit tree root is finalized, a malicious proposer can create (fake) proofs of deposits that verify against the (fake) deposit tree root. The result, which I described in the example of Alice double-spending validator deposits, is that we end up creating new validators on the Beacon Chain _without_those validators depositing 32 ETH to the deposit contract.

An attack like this one has negative implications for the Beacon Chain's security. The point of Proof of Stake is to make it as expensive to join the validator set as possible, so it _really_hurts when the protocol destroys a validator's stake and ejects them from the consensus protocol. This is why we require every validator to lock up a minimum amount of collateral (32 ETH) in the deposit contract before it starts validating transactions.

But this security property breaks down when some validators are able to join the validator set without processing deposits. For example, if Alice is able to double-spend her 32 ETH deposit multiple times, she will have a disproportionate amount of Ether staked on the Beacon Chain relative to validators that deposited once. This means Alice can afford to risk committing slashable offenses (e.g., voting invalid blocks or reverting blocks) because the protocol is taking money she got for _free_.

The attack also affects Ethereum's execution layer negatively: if Alice starts withdrawing validator balances from the Beacon Chain to the execution-layer withdrawal address, she can bypass the protocol-enforced issuance policy and print more money out of thin air than the Federal Reserve. This will (inevitably) crash the market value of ETH, which is tied to scarcity and supply, an and reduce the appeal of holding, spending, and using ETH—with implications for financial applications running on Ethereum.

In theory, a safety attack on the Eth1-Eth2 bridge requires ⅔ of validators (66% of stake) to collude and finalize a Beacon block that incorrectly updates `state.eth1data`. But an adversary with 47% of the total effective balance can achieve a similar goal:

1. If 47% of validators vote for a different block than the other 43% of validators, the Beacon Chain—which requires at least 66% of validators to agree on the validity of the same block—cannot achieve finality. The Beacon Chain will thus split into two competing forks since we have close to equal halves of the validator set attesting to different blocks at the same height.

2. If neither chain finalize a block for more than a fixed number of epochs, the [inactivity leak](https://www.cryptofrens.info/p/the-inactivity-leak)will kick in and reduce the balances of active validators that failed to attest on each fork. Decreasing the stakes of non-voting validators ensures the remaining set of validators on each fork can reach the threshold (⅔ of the active stake) required to finalize blocks.

3. The inactivity leak can ensure the minority of validators can finalize the chain with the correct Eth1Data. However, the attacker has the upper hand and requires just 21% of validators to double-vote (47% (adversary's validators) + 21% (double-voting validators) = 66% supermajority) to complete the attack. In normal circumstances, double-voting (voting for two conflicting blocks in the same slot) is disincentivized; but it becomes easy, important even, for validators to hedge their bets by double-voting during a contentious fork.

Recall that the value of the ETH staked by a validator depends on which fork is considered canonical at the end—if Bob's 32 ETH is on fork A, but fork B is accepted by exchanges, applications, and everyone else as the valid fork, Bob's ETH loses value (except the fork A chain becomes the new [Ethereum Classic](https://en.wikipedia.org/wiki/Ethereum_Classic)). This makes double-voting (voting on blocks on two chains) the dominant strategy for validators like Bob—a situation that plays nicely into the attacker's hands.

Once fork B (which we consider the attacker's fork) becomes the canonical fork, it can finalize an invalid `deposit_root`and start processing fake deposits. The attacker can only process up to 16 deposits per block (MAX_DEPOSITS_PER_BLOCK) and 512 deposits per epoch, which is 16, 384 ETH per epoch (16 * 32 ETH per validator). But then, it can keep processing invalid deposits as long as it takes to recoup all of the funds used to bribe validators _and_make a healthy profit from the attack.

Security problems aside, the design of the Eth1Data bridge also induces a couple of other issues in the area of performance and efficiency. These also have to do with the distinction between the execution (Eth1) chain and consensus (Eth2) chain before the Merge.

Suppose we trusted the majority of proposers to act honestly during Eth1Data polling, we still wouldn't be able to make the same assumption about miners running the Eth1 PoW chain. The proposers voting in the Eth1Data poll might include valid Eth1 block roots but, as the example of Alice's deposit transaction showed, a set of colluding miners could revert the PoW chain and allow malicious validators double-spend their deposits. Since free entry into the Beacon Chain's validator set threatened economic security of Ethereum's Proof of Stake protocol, it was necessary to isolate the Eth2 chain from failures in the Eth1 chain (e.g., chain reorganizations).

The solution? Impose a delay on the processing of deposits to make deposit processing resilient to reorgs. Known as the " **Eth1 follow distance"**, this delay determined when the Eth2 chain would even _consider_a set of deposits pending in the deposit contract. The Eth1 follow distance (`ETH_FOLLOW_DISTANCE`) was first set at 1024 blocks and later increased to 2048 blocks—and a proposer was expected to only consider blocks at a depth higher than this value when choosing blocks to vote for in the Eth1Data poll.

For example, if the Beacon Chain was at block #6144, the validator responsible for proposing Beacon block #6145 was expected to consider only deposit contract data from Eth1 block #4096 onward as eligible candidates for an Eth1Data vote. This ensured that deposits processed on the Eth2 chain never ended up in a reorged Eth1 block, except the Eth1 chain reverted blocks for more than eight hours. We derive the eight-hour window by multiplying `ETH_FOLLOW_DISTANCE`(2048 blocks) by `SECONDS_PER_ETH1_BLOCK`(14 seconds).

Besides making the Eth1-Eth2 bridge resilient to reorgs, the Eth1 follow distance gave meant protocol developers and the community had enough time to respond to major issues on the execution (Eth1) chain that might affect deposit processing on the consensus layer (e.g., a chain split). But the improvement in security came with a significant tradeoff: validators couldn't process deposits instantly and would need to wait ~16 hours (8 hours for Eth1 follow distance and 8 hours for Eth1Data voting period). Note that this calculation doesn't account for other delays, like the time a deposit transaction spends in the mempool before it is included in a block.

But wait, there's more! Relying on the Eth1Data polling to import the execution layer state into the consensus layer before processing deposits also has more negative effects beyond delaying increasing onboarding friction for new validators:

The requirement for deposits to wait in the deposit contract for at least eight hours (`ETH_FOLLOW_DISTANCE`) distance already imposes a significant delay on processing of deposits on the consensus layer. But other factors can exacerbate this delay and increase the time it takes to deliver a deposit to the Beacon Chain via the Eth1-Eth2 bridge. An example: proposers are restricted to including 16 deposit operations per Beacon block (`MAX_DEPOSITS_PER_BLOCK`) to bound the size of blocks and avoid burdening validators with high resource requirements.

As mentioned, deposits included in Beacon blocks must be accompanied by a Merkle proof that each validator verifies against the root of the deposit Merkle tree (stored in `state.eth1data`). Validators must perform a minimum of 32 hashing operations to compute the root of the deposit tree from the Merkle branch received from proposer, which is extra computation on top of routine block processing on the consensus layer.

Also note that the Merkle proof for each deposit (an array of hashes) adds extra data to the body of a Beacon block (further necessitating a limit on the number of deposits that each block can include). Given this limit on deposit operations, a depositor may have to wait more than 17 hours before their deposit (or balance top-up) can be processed—depending on how many deposits have been processed since the last Eth1Data polling period and the number of pending deposits.

The complexity associated with maintaining the Eth1-Eth2 bridge comes from a number of areas:

Consensus clients maintain an _Eth1 DataFetcher_component that regularly queries the execution client (using the JSON-RPC API) for information related to the deposit contract. For example, proposers rely on `eth_call `to perform the `get_deposit_root() `operation that calculates the root of the deposit contract's Merkle tree, `eth_getLogs`to extract deposit events emitted by the deposit contract from transaction receipts (more on this later), and `eth_getBlockByNumber`to retrieve the list of block hashes eligible for voting in the Eth1Data poll.

Validators are also required to hold a local copy of the deposit Merkle tree and verify that the root matches the `deposit_root`from the winner of the Eth1Data poll. This requires running the `eth_getLogs`operation to download event logs from previous logs and extracting deposit events from each block (where a deposit was made) and building a Merkle tree out of the list of extracted deposits. Unlike proposers, validators don't need to interact directly with the deposit contract and can perform this task by interacting with a local execution client using the JSON-RPC API.

The Eth1Data Fetcher component is, however, a complex piece of software to maintain and operate. That complexity probably explains why a decent number of node operators have experienced issues with their nodes failing to pull deposit contract logs, or returning incorrect deposit receipts and corrupting the deposit contract data in worst-case scenarios.

Some client developers suggest that inconsistencies in the implementation of the JSON-RPC API may be contributing to the problem. Different clients use different methods to retrieve deposit receipts from blocks, which can creates an issue if a consensus client requests deposit contract data using a format that the attached execution client doesn't implement or support.

The complexity of the Eth1Data syncing process also affects the onboarding experience for new validator node operators. Typically, a Beacon node needs to sync the execution client from genesis as part of the normal workflow before it can start validating and processing blocks. But it also needs to sync the deposit contract logs (to extract and process historical deposits) before it can fully catch up with the rest of the network and start proposing/attesting blocks.

Having to rebuild the state of the deposit contract from scratch adds to the workload for a new validator. The problem is more complicated for individuals who just want to run a Beacon node to track Ethereum's consensus layer without attesting or proposing blocks—some have called for consensus clients to implement an option to disable syncing of historical deposit logs for this reason. Lighthouse already has [an option for non-staking Beacon nodes to skip syncing of historical deposit receipts](https://lighthouse-book.sigmaprime.io/run_a_node.html#non-staking), but this doesn't seem to be standardized across other client teams yet.

Consensus clients are required to store a cache of historical deposit receipts—extending to the Beacon Chain's genesis—in order to validate new blocks (necessary for rebuilding the deposit Merkle tree and verifying Merkle proofs of deposits as mentioned previously). While the deposit contract can theoretically store all the deposit data as leaves in a Merkle tree, storing deposits in even logs is cheaper for certain reasons and, importantly, reduces the on-chain footprint.

The downside to storing historical deposits in logs is that it constrains validators from pruning parts of the chain's history dating back to the deployment of the deposit contract. This increases disk requirements for execution nodes and also represents an obstacle to history expiry proposals like EIP-4444 designed to reduce the amount of archival data execution clients must process. (To understand the difference between history and state, I encourage reading ).

Eth1Data voting seems straightforward on paper:

I'm largely oversimplifying things here, but that's because the Eth1Data voting mechanism is designed (in principle) to be simple. Even so, implementing Eth1Data polling has proven difficult for many client teams. This reduces the efficiency/effectiveness of the Eth1Data poll, as proposers cannot come to agreement quickly on a common view of the deposit contract and finalize pending deposits.

Ben Edgington's _ [Analysis of Eth1 Data votes on Medalla](https://github.com/ethereum/consensus-specs/issues/2018)_provides a pretty good overview of the issues client teams have faced with getting the Eth1Data implementation to work correctly. The analysis, which used data collected over 72 Eth1Data voting periods (2,304 epochs or ~10 days) on the Medalla testnet, points out a startling metric: the chain failed to agree on an Eth1 block hash in **22%**of Eth1 data voting periods.

Interestingly, there were no failures to reach a 50% + 1 majority on the root of the deposits Merkle tree throughout the same period. According to the author, this discrepancy was likely because the deposit tree root changed less frequently than the block hash (there were 3 to 140 block hashes voted for during the same period).

Since `deposit_root`was (arguably) more important, it was suggested to have proposers come to consensus separately on `deposit_root `and `block_hash`. The data suggested proposers found it easier to agree on deposit roots compared to block hashes, so removing the dependency between block hashes and deposit tree roots could significantly improve the efficiency of tracking deposits. You can see the code snippet of the proposed design below:

The proposed design altered the Eth1Data voting strategy to expedite finality for deposit roots and remove blockers to processing deposits and onboarding new validators. But it also introduced some unnecessary complexity in the specification—unnecessary because the [honest validator specification](https://github.com/ethereum/consensus-specs/blob/v1.3.0/specs/phase0/validator.md#eth1-data)already provides a straightforward mechanism for proposers to reach consensus on Eth1Data without issues.

In theory, proposers can include different Eth1Data since `deposit_root`and `deposit_count`change according to the number of deposits from the previous block—which would make it difficult for a majority of proposers to agree on the same Eth1Data. However, if each proposer followed the honest validator specification (voting with the majority), we should have at least ½ of proposers including the same Eth1Data in blocks before the voting period is over.

Here's a [reply](https://github.com/ethereum/consensus-specs/issues/2018#issuecomment-679274937)to the suggestion from Danny Ryan (core developer at the Ethereum Foundation) for context:

> _"This seems like implementation errors rather than spec errors. Any failure to agree on a block-hash/deposit-root combo after the first epoch (assuming max 1 epoch latency) is just a failure to follow the spec._
_votes_to_consider should be 100% in agreement amongst implementations if we assume there are no forks in the eth1 chain 1000+ blocks deep [this is true in goerli 100% of the time]. Then if votes_to_consider is in agreement and I am looking at a handful of blocks, my vote is entirely deterministic regardless of client implementation and should quickly solidify as the chain during that voting period grows deeper. I'd like to better understand why the issue in conformance before we go change the spec."_

Real-world data suggests Danny's position in the quote I included above has some merit. For example, the Prysm consensus client [merged a pull request](https://github.com/prysmaticlabs/prysm/pull/7200)(less than a month after Ben's post) to align the client's implementation of the Eth1Data majority voting algorithm with the official specification after a user pointed out discrepancies between the implementation code and the official spec and the implementation. Teku also [made a similar patch to its consensus client](https://github.com/Consensys/teku/issues/4005)after discovering subtle deviations from the honest validator specification for running the Eth1Data poll.

So far we've identified two major categories of issues with the Eth1-Eth2 bridge and the deposit processing mechanism: security and performance. Different solutions have been proposed to remedy some of the problem:

After highlighting the possibility of an attacker with 47% of the total active stake exploiting the bridge, Mikhail Kalinin [suggested increasing the winner threshold](https://ethresear.ch/t/on-the-way-to-eth1-finality/7041)for the Eth1Data poll from 50% to 60%. An adversary could only gain a supermajority (⅗) of proposers during the Eth1Data voting period (1,228 proposers) if it controlled a supermajority (⅔) of the total active stake—bringing the security of the Eth1-Eth2 bridge in line with the security of the Beacon Chain.

That said, this solution sacrificed some measure of safety for liveness. What do I mean? The new threshold required 60% of proposers in the Eth1Data voting period to attest to the same view of the execution chain's state—which increased the impact of a minority that (deliberately) refused to vote for Eth1 block hashes or cast incorrect Eth1Data votes on purpose.

Another proposal (from the same post) was for attesters and proposers to share the responsibility of importing Eth1data into the Beacon Chain. Attesting validators included eth1_data (`deposit_root`, `deposit_count`, and `block_hash`) in attestations and state.eth1data was updated with the set of Eth1Data that received votes from ⅔ of validators. This solution allowed the chain to finalize deposits much faster and, importantly, coupled the security of the Eth1-Eth2 bridge with the Beacon Chain's security (as long as ⅔ of validators are voting correctly, the chain couldn't be tricked into accepting invalid Eth1data).

However, the main concern with this approach at the time was the increased load on the networking layer. With validators attesting to Eth1Data every epoch, each attestation needed extra 64 bytes for Eth1data and the size of an attestation message increased by nearly 50%.

Reducing `SLOTS_PER_ETH1_VOTING_PERIOD`was a fairly straightforward solution to the problem of delayed deposit processing. But the boost in efficiency of the Eth1-Eth2 bridge came at the expense of the safety of deposit processing: if the voting period was reduced, the probabilities of an attacker controlling a majority of proposers in the committee voting on Eth1Data would also increase.

Below is a table showing the probabilities of an adversarial takeover of the Eth1Data poll at different parameters for `SLOTS_PER_ETH1_VOTING_PERIOD`—notice the differences in probabilities when Eth1Data voting period is decreased to 128 slots and 64 slots:

Another proposal (from the same post) was to reduce `ETH1_FOLLOW_DISTANCE`from 2048 blocks to a smaller figure. At the time, this was a risk for the reasons I explained previously (e.g., the risk of miners going rogue and executing short-term reorgs). This is no longer a risk in the status quo where the Beacon Chain finalizes the execution layer, but the question remains: "Why should we try and fix the Eth1-Eth2 bridge by adjusting parameters if it's already redundant?"

* New consensus nodes must download deposit receipts from historical blocks to process blocks when syncing the Beacon Chain (increasing syncing times and creating friction for onboarding validators).

* Active consensus nodes also need to maintain a cache of historical deposit receipts if they want to create valid Merkle proofs for deposit transactions when proposing new blocks.

EIP-4881 solves this problem by creating an interface for consensus client implementations to bootstrap syncing by transmitting "snapshots" of the deposit contract's state at specific block heights. These snapshots contain finalized deposits and can be used to rebuild the deposit Merkle tree (and verify Merkle proofs for new deposits) without syncing historical deposit contract logs. This makes it easier to sync a new Beacon node and provides a solution for execution clients that wish to prune historical data from their local databases.

While EIP-4881 is an improvement to node operator UX, it _is_a workaround—not a sustainable, long-term solution. Some reasons distributing EIP4881-style deposit contract snapshots may prove unsustainable:

* It places a burden on teams building consensus clients to create and maintain additional features. Ideally, client teams would only have to reason about sinking (expensive) engineering hours into designing and maintaining only the most critical components of a consensus client.

* Client development teams are implicitly trusted to provide correct deposit contract snapshots. A validator can choose to verify deposit contract snapshots against other sources, but this somewhat defeats the purpose of reducing the difficulty of syncing a new node.

Like many aspects of the Beacon Chain's design, the current mechanism for processing deposits is accumulated tech debt from the pre-Merge days. If the execution and consensus layers were connected, we wouldn't need a bridge mechanism to pass information about deposits as both protocols would be validated by the same set of consensus nodes.

But things have changed rapidly since the Merge:

* Ethereum's execution and consensus layers operate _synchronousl_y: every Beacon Chain block includes execution-layer data in the block body (`ExecutionPayload`). This means deposit contract data (i.e., deposits receipts) required to process deposit transactions on the Beacon Chain is now available on-chain by default. Consensus nodes no longer need an Eth1Data Fetcher component because the deposit contract data is visible on-chain and accessible to a validator's attached execution client.

* The problem of reorged deposits has also ceased to exist: Ethereum's fork-choice rule enforces a tight coupling between the execution and consensus layers by requiring CL blocks to include the header and body of the latest execution block. This removes the possibility of reorging EL blocks containing deposits without reorging (finalized) CL blocks and implies that the delay on deposit processing (a consequence of `ETH_1_FOLLOW_DISTANCE`and `ETH1_DATA_VOTING_PERIOD`) is surplus to requirement
* The execution layer is now finalized and secured by the consensus layer. Each validator is expected to verify the execution payload of a Beacon block (which stores information about the EL state, including the root of the deposit contract Merkle tree)—meaning all honest nodes have the same view of the deposit contract at all times. This makes the Eth1-Eth2 bridge for importing block hashes into the Beacon state and the Eth1Data poll for securing the process altogether unnecessary.

These observations underpin EIP-6110, which proposes the most comprehensive overhaul of the Beacon Chain's deposit processing system to date. EIP-6110 removes Eth1Data poll and Eth1-Eth2 bridge and introduces a newer, more efficient mechanism for processing deposits and onboarding validators to the Beacon Chain. I'll dive into EIP-6110's approach to reforming the deposit process—but first, let's take a detour to understand a concept that'll come up frequently in the discussion of EIP-6110: **events**and **transaction receipts**.

Smart contracts fire or emit **events**during execution; for example, a token contract may fire an event if ownership of the token is transferred—an event is semantically equivalent to "something that occurred on-chain". **Logs**are used synonymously with events, but have a different meaning: a log is generated when the contract emits an event and provides details about the emitted event. Smart contracts generate logs by firing off events and logs describe the outcomes associated with the event.

Anytime a transaction is processed, we can view the transaction's event logs—by making a request to `eth_getLogs `via the JSON-RPC API to a full node—and take further action based on the results of the transaction. For example, if a buyer is paying for a cup of coffee in DAI, we can call `eth_getLogs`on the DAI ERC-20 token contract to confirm the buyer's payment before processing the order.

Logs have a topic and data field: log topics are 32-byte words that describe the inner workings of an event; the EVM (Ethereum Virtual Machine) has five opcodes developers can use to emit events and create log records logs (`LOG1`, `LOG2`, `LOG3`, `LOG4`, and `LOG5`). The opcodes describe how many topics can be included in a log—the deposit contract uses the ` LOG1`opcode as it has only one topic:

1. The first part of the log (`topic`) contains an array of (log) topics describing the event and can hold up to five topics depending on the `LOG`opcode used. The first topic usually stores the _event signature_—a hash of the event name and parameters of the function whose execution emits an event. The deposit contract's event log, which uses the LOG1 opcode, has only one topic: the `DepositEvent`signature: `0x649bbc62d0e31342afea4e5cd82d4049e7e1ee912fc0889aa790803be39038c5`(the Keccak-256 hash of `DepositEvent(bytes,bytes,bytes,bytes,bytes)`).

`DepositEvent`is the name of the event emitted by the deposit contract when a deposit is processed and the `bytes `refer to the hex encoding of the inputs to the `deposit()`function (among other things):

* `pubkey`: A 48-byte value representing the public key of the validator. The public key is derived from the private key generated from the validator's seed phrase or mnemonic and represents the validator's cryptographic identity in the consensus protocol.

* `amount`: The amount of ETH to deposit denominated in Gwei (a subunit of Ether). A depositor can send the full deposit (32 ETH) to register a new validator, or top up the balance of an active validator. It can also build up the 32 ETH deposit required to activate a validator over multiple deposits.

* `withdrawal_credentials`: The address to receive the validator's full/partial withdrawals from the Beacon Chain. Withdrawal credentials start with 0x0 or 0x1 depending on whether the validator is using a BLS ([Bonneh-Lynn-Sachman](https://en.wikipedia.org/wiki/BLS_digital_signature)) withdrawal address or an execution-layer address—see [EIPs For Nerds #2: EIP-7002](https://ethereum2077.substack.com/p/eip-7002-execution-layer-exits)for a great introduction to different types of validator's withdrawal credentials.

* `signature`: The signature generated by signing the previous three fields with the validator's signing key. The signature is required to protect against a rogue-key attacks that can enable attackers to [create invalid validators](https://medium.com/@coolcottontail/rogue-key-attack-in-bls-signature-and-harmony-security-eac1ea2370ee)on the Beacon Chain.

* `index`: The index is an _output_of the deposit operation and is assigned to each deposit processed by the deposit contract. s a value that increases each time a new deposit stored in the deposit contract.

2. The second part of the log (`data`) contains encoded data relevant to the event. This information can be indexed in the topics field, but log topics have a 32-byte limit, whereas data fields are unlimited storage. The data field can support storing complex types like strings and arrays, which makes it useful for our use-case: storing an array of inputs to the deposit contract's `deposit() `function so that we can later extract it by parsing deposit contract event logs and record it in the Beacon Chain's state when processing a validator's deposit for the first time.

When a smart contract emits an event, the associated log data is written and recorded in a transaction **receipt**. A receipt is a record of outcomes associated with a particular transaction and includes details like the logs generated during transaction execution and the transaction's status code (e.g., failed or successful). Transaction receipts are stored in the [receipts trie](https://medium.com/coinmonks/ethereum-data-transaction-receipt-trie-and-logs-simplified-30e3ae8dc3cf)of a block, which isn't part of Ethereum's global state and receipt data is inaccessible to the smart contract (nodes can extract receipts from historical blocks by [running in archive mode](https://ethereum.org/en/developers/docs/nodes-and-clients/archive-nodes/#what-is-an-archive-node), or requesting the data from an archive node).

In comparison, account storage can be accessed by the smart contract and is persisted in Ethereum's global state, but is more expensive to use (because every node must hold state and the state grows indefinitely—which increases storage disk requirements—we need to make sure the cost of storing and accessing state data is enough to incentivize nodes and high enough to prevent abuse).

This makes event logs cheaper for storing data compared to saving information in a smart contract's storage (log data costs eight gas per byte and account storage costs 20,000 gas per 32 bytes). The deposit contract's event data is 576-byte ABI encoding of `pubkey`, `withdrawal_credentials`, `amount`, `signature`, and `index`. Below is a sample event data emitted by the deposit contract after a successful deposit:

The **[Application Binary Interface](https://www.alchemy.com/overviews/solidity-abi)**(ABI) specifies how to interact with a smart contract like the deposit contract—whether from another or via an off-chain service. The ABI for a smart contract includes the contract's function names, input parameter, parameters, constants, event types (logs), and data structures. ABI-encoded data is not human-readable, but we can implement ABI decoding (using information from the ABI) to translate the result of a contract's execution into human-readable syntax.

This overview of contract events and receipts is (admittedly) into-the-weeds—even I had trouble grasping some of these concepts initially. But a basic understanding will make it easier to understand EIP-6110, which uses the terms "deposit events" and "deposit receipts" in many parts of the specification. With that out of the way, we can see how EIP-6110 works at a high level:

At a high level, EIP-6110 works as follows:

1. The execution client parses deposit contract event logs and _explicitly_exposes deposits to the Beacon Chain by including deposit data in the execution payload of a Beacon block. When building the execution payload, the validator's execution client scans for deposit transactions that emit a deposit event in the block and extracts the deposit data (`pubkey`, `amount`, ` withdrawal credentials`, and `index`) from the corresponding logs.

The extraction of deposits from a block is order-sensitive: it must strictly follow the order in which deposit transactions generate event logs and receipts appear during the block's execution. After extracting deposits from transaction receipts, the execution node's block production component populates the deposits field of the block with deposit data. The block producer is expected to include all pending deposits (up to the maximum) in the execution payload before passing the payload to the Beacon node via the [Engine API](https://hackmd.io/@danielrachi/engine_api).

2. Upon receiving an execution payload with a list of deposit operations, the validator passes the payload to its execution client to verify the deposits. The validator's execution client will proceed to extract deposits from the events emitted by the deposit transactions included in the block and compare the two sets of deposits. The extraction of deposits from a block is order-sensitive: it must strictly follow the order in deposit transactions generate event logs and receipts appear during the block's execution:

The validator's execution client is required to verify that the list of extracted deposits is equal to the deposits in the payload of the proposed Beacon block. Besides having the same number and ordering of deposits, the values for each deposit operation in the list of deposits must also be the same. Honest validators that detect conflicts between the extracted deposit operations and the deposits supplied by the proposer are expected to reject the entire block.

3. After the validator's execution client has verified the deposits included in the execution payload, the consensus client can securely read the deposit data from the Beacon block and process each validator's deposit per the normal workflow. The proposer isn't required to include a Merkle proof to verify inclusion of the deposit transaction in the Merkle root as the execution layer already verifies the existence of the deposit.

You'll notice in this scheme that a validator's deposit is processed in the same block where it appears—this "instant inclusion of deposits" is thanks to EIP-6110 deprecating the Eth1Data poll and surfacing deposits on-chain for validators to process immediately. EIP-6110 also fixes some of the problems I highlighted earlier, such as the reliance on the JSON-RPC API to fetch historical block hashes and sync deposit receipts cache. Since execution clients are already expected to download execution payloads, which provides real-time access to transaction receipts, `eth_getLogs`is no longer necessary.

We'll go over more of EIP-6110's benefits after looking at the changes introduced by EIP-6110 based on the [specification](https://eips.ethereum.org/EIPS/eip-6110):

EIP-6110 defines a new deposit operation and modifies the Engine API to include deposit operations in execution payloads via a new `deposits`field. The `deposit `object is the same as the `deposit_data`signed by validators when making a deposit transaction (the deposit contract emits the deposit data a `DepositEvent`). The new deposit operation has the following structure:

```
<code>class Deposit(object):
&#xA0;   pubkey: Bytes48

&#xA0;&#xA0;&#xA0;&#xA0;withdrawal_credentials: Bytes32

&#xA0;&#xA0;&#xA0;&#xA0;amount: uint64

&#xA0;&#xA0;&#xA0;&#xA0;signature: Bytes96

&#xA0;&#xA0;&#xA0;&#xA0;index: uint64&#xA0;</code>
```

The `deposit`object forms the basis of EIP-6110's objective of "supplying validator deposits on-chain". Beacon nodes already have access to deposit transactions via the execution engine, but a consensus client cannot parse deposit contract logs and decode ABI-encoded deposit data. Execution clients, however, support ABI decoding and provide access to deposit data by including deposit data in the `ExecutionPayload `in a format that consensus clients can translate.

EIP-6110's deposit object includes an `index`: an unsigned integer value assigned to each deposit that's accepted by the deposit contract (as mentioned previously). The index functions like a [transaction nonce](https://help.myetherwallet.com/en/articles/5461509-what-is-a-nonce)and ensures deposits can be processed once; the index is also stored in the Beacon Chain's state, which ensures deposits are processed sequentially and proposers cannot skip pending deposits (more on this later).

After extracting deposits (sequentially) from deposit contract logs, the execution engine creates a [Merklized summary](https://eth2book.info/capella/part2/building_blocks/merkleization/#hash-tree-roots-and-merkleization)of deposit operations and populates the `deposit_root`field with the hash of the Merkle trie root. The `deposits_root`object is included in the header of the execution payload (`ExecutionPayloadHeader`) and acts as a cryptographic commitment to the list of deposit operations in the block.

A validator's execution node performs a similar routine (computing the hash of the root of a Merkle trie that encodes deposit operations as leaves) and compares the root hash with the `deposits_root`in the header of a Beacon block's execution payload. Honest validators are expected to reject a proposed block if the trie roots conflict.

The code for extracting deposits from deposit events looks like this:

```
def event_data_to_deposit(deposit_event_data): Deposit

deposit_data = parse_deposit_data(deposit_event_data)

&#xA0;&#xA0;return Deposit(

&#xA0;&#xA0;&#xA0;&#xA0;pubkey=Bytes48(deposit_data[0]),

&#xA0;&#xA0;&#xA0;&#xA0;withdrawal_credentials=Bytes32(deposit_data[1]),

&#xA0;&#xA0;&#xA0;&#xA0;amount=little_endian_to_uint64(deposit_data[2]),

&#xA0;&#xA0;&#xA0;&#xA0;signature=Bytes96(deposit_data[3]),

&#xA0;&#xA0;&#xA0;&#xA0;index=little_endian_to_uint64(deposit_data[4])

&#xA0;&#xA0;)
```

And the code for calculating the root of the Merklized summary of deposit operations included in a Beacon block's execution payload looks and comparing it to the `deposits_root`in the block header looks like this:

```
<code>def compute_trie_root_from_indexed_data(data):

&#xA0;trie = Trie.from([(i, obj) for i, obj in enumerate(data)])

&#xA0;&#xA0;&#xA0;&#xA0;return trie.root

block.header.deposits_root = compute_trie_root_from_indexed_data(block.body.deposits)</code>
```

A transaction can perform multiple actions and generate different logs, so we need a mechanism to identify logs that refer to deposit events in a block. A log is associated with a deposit event if the log address (the address of the smart contract that generated the log) is the [deposit contract's address](https://etherscan.io/address/0x00000000219ab540356cBB839Cbe05303d7705Fa): `0x00000000219ab540356cBB839Cbe05303d7705Fa`. EIP-6110 introduces a `depositContractAddress`object into the Engine API's configuration file to ensure execution clients extract deposits from the correct event logs.

The structure of Beacon block is modified to include a new `DepositReceipt `object. The `DepositReceipt `object is the same as the deposit object included in `ExecutionPayload`. A separate name is used for EIP6110-style deposit operations on the Beacon Chain to avoid a conflict with the [existing deposit operation](https://github.com/ethereum/annotated-spec/blob/master/phase0/beacon-chain.md#deposit). The `DepositReceipt`object has the following structure:

```
<code>class DepositReceipt(Container):
    pubkey: BLSPubkey

&#xA0;&#xA0;&#xA0;&#xA0;withdrawal_credentials: Bytes32

&#xA0;&#xA0;&#xA0;&#xA0;amount: Gwei

&#xA0;&#xA0;&#xA0;&#xA0;signature: BLSSignature

&#xA0;&#xA0;&#xA0;&#xA0;index: uint64</code>
```

Beacon blocks can include a number of deposit receipts up to `MAX_DEPOSITS_RECEIPTS_PER_PAYLOAD`. Note that MAX_DEPOSIT_RECEIPTS_PER_PAYLOAD is an _implied_limit on deposit operations and is equal to the number of deposits that can be packed into an execution block, given the gas limit (30 million gas). In comparison, the current `MAX_DEPOSITS_PER_BLOCK = 16 `constant that currently limits deposit operations is _explicit_: a validator is expected to confirm that a proposed block doesn't include more than 16 deposits during Beacon block processing.

The Beacon block also takes a new `deposits_receipts_root`object (included in the header) that is similar to `deposits_root`. The `deposits_receipts_root`field is the commitment to the list of deposit receipts from a Beacon block and should equal the root computed by a validator's execution engine after extracting deposit receipts from a Beacon block and hashing them together to create a Merkle trie.

_**Note**: The term "deposit receipt" may be a misnomer since we're including data from event logs contained in transaction receipts. Some will describe the deposit contract as "emitting a deposit receipt for accepted deposits", which is slightly inaccurate—a transaction's receipt can include multiple logs, and not all logs have to contain a topic and data associated with a deposit event. This is why EIP-6110 specifies a deposit contract address to help identify deposit event logs from a block's transaction receipts._

The [process_operations()](https://github.com/ethereum/annotated-spec/blob/master/phase0/beacon-chain.md#operations)function covers the tasks a validator must perform to process a newly proposed Beacon block and update the Beacon Chain's state. This to-do list includes processing slashing of proposers and attestations, voluntary exit operations, deposits, and balance top-ups. EIP-6110 modifies process_operations() to include a `process_deposit_receipts`operation to accommodate the new deposit operations.

A couple of things are happening in this function:

* `process_deposit_receipt `first initializes the `deposit_receipt_start_index`in the Beacon state (`deposit_receipt_start_index`is "unset" as at the fork block) by setting `deposit_receipt_start_index`to the `deposit_receipt_index`when the first deposit is processed under the new mechanism. This tracks the number of deposits that have been processed so far (more on this later).

* `process_deposit_receipt `applies the deposit to the Beacon state (to either create a new validator in the beacon state or top up an existing validator) via `apply_deposit`. The apply_deposit function is already implemented in consensus clients, which helps with code reuse.

* The `process_deposit_receipt`operation is where the validator's signature is checked for the first time—the deposit contract doesn't verify the signature in the deposit_data because the EVM doesn't currently have support for verifying BLS12-381 signatures ([EIP-2537](https://eips.ethereum.org/EIPS/eip-2537)is a proposal to add a precompile for BLS12-381 signature verification, which may change the situation). An implication is that an attacker can send fake deposit transactions that are doomed to fail on the consensus layer and perform a DoS (denial-of-service) attack by causing consensus nodes to waste resources on validating bad deposits.

Consensus clients save a `eth1_deposit_index`value in the Beacon Chain's state that tracks the total number of deposits processed by the protocol. The `eth1_deposit_index`is incremented by one for each processed deposit and equals the `index`assigned to the most recent validator deposit by the deposit contract when the deposit was made on the execution layer (recall `index`is part of the event data emitted by the deposit contract).

By saving the `eth1_deposit_index`in the Beacon state, we can prevent proposers from accidentally/deliberately excluding pending deposits. For example, if the current eth1_deposit_index is `1000`, the next validator deposit should have an `index`of `1001`; if the deposit instead comes with an `index`of `1002`, a validator knows that at least one pending deposit was skipped and should reject the block.

EIP-6110 introduces a `deposits_receipts_index`to serve a similar purpose as the `eth1_deposit_index`. `deposit_receipts_index`tracks the number of deposit operations that have been processed by the Beacon Chain under EIP-6110 and ensures deposits are processed sequentially. If a proposed block skips one or more deposits from the deposit contract, the end state will diverge from the resulting state obtained by an honest node applying deposits in the correct order.

The length of Eth1 follow distance means there will be a transition period during which deposits approved in the Eth1Data poll are yet to be processed, but validators on the Beacon Chain have upgraded consensus clients to start using EIP-6110's in-protocol deposit processing mechanism. During this transition period, validators have to maintain different sets of deposit operations: deposits to be processed using the old `process_deposit()`operation and deposits to be processed using the new `process_deposit_receipt()`operation.

EIP-6110 makes some modifications to ensure a smooth transition period and prevent old deposits from conflicting with new deposits:

1. The `BeaconState`object is modified to include a new `deposit_receipts_start_index`field that stores the index of the first deposit included on-chain per EIP-6110 specifications. The `deposits_receipts_start_index`value is initialized by the block that activates EIP-6110 and works with the `eth1_deposit_index_limit`to facilitate the deprecation of the Eth1Data poll and Eth1-Eth2 bridge mechanism.

2. A new value (`eth1_deposit_index_limit`) is added to the `process_operations() `function to disable the former deposit mechanism once all pending deposits are processed. The `eth1_deposit_index_limit`will be the lesser of `eth1_deposit_count`(the number of deposits pending in the deposit contract) or `state.deposit_receipts_start_index`(the index of the first on-chain deposit).

Here's how the transition period works:

1. When processing a new deposit, we check whether `eth1_deposit_index_limit`is greater than `eth1_deposit_index`. If the `index`of the current deposit is lower than `eth1_deposit_index_limit`, we know that the transition period is still ongoing and there are pending deposits from the Eth1Data poll.

3. After confirming the status of the transition period, we check that the number of deposits is the lesser of `MAX_DEPOSITS_PER_BLOCK`(16) or `eth1_deposit_index - state.eth1_deposit_index`. This check is crucial for confirming that a proposer has included all pending Eth1-Eth2 bridge deposits up to the maximum limit (16 deposits per block).

4. If a new block arrives and `eth1_deposit_index`at a specific deposit is equal to `eth1_deposit_index_limit`, we know that this deposit is the last deposit from the Eth1Data poll. We disable processing of deposits under the Eth1-Eth2 bridge mechanism and deprecate the Eth1Data poll at this point. This means the [is_valid_merkle_branch](https://github.com/ethereum/annotated-spec/blob/master/phase0/beacon-chain.md#is_valid_merkle_branch)check that is performed when applying a deposit (verifying the Merkle proof against the ` deposit_root`stored in `state.eth1_data`) is no longer necessary.

As explained, execution payloads (formerly Eth1 blocks) now form a part of proposed Beacon blocks. Beacon nodes do minimal processing on execution payloads and leave most of the verification to execution clients; however, a Beacon node must check that the `ExecutionPayload`of a new block is valid in the view of its execution node.

This is where `process_execution_payload`comes into the picture: `process_execution_payload`performs sanity checks on the payload, including checking that the header of the execution block stores the (correct) hash of the previous block's header (the hash is stored in the Beacon Chain's state as `LatestExecutionPayloadHeader`) and the timestamp on the execution payload matches the current slot's timestamp.

`process_execution_payload`also stores header data from the current execution payload in the `BeaconState`. Under EIP-6110, `process_execution_payload`is modified to store an additional piece of header data: `deposit_receipts_root`. This way, a consensus node validating the execution payload of a new Beacon block can confirm that a newly proposed block is correct with respect to the previous block (e.g., it includes the correct value for the previous block's `deposit_receipts_root`). This enforces a link between deposits processed in blocks and prevents some of the edge-cases described previously—such as double-spending of old deposits.

The benefits of implementing on-chain validator deposits per EIP-6110 may already be obvious from the discussion of the specification. However, this section will provide a more focused explanation of the advantages of reforming the current process for handling deposits:

The security of the Eth1-Eth2 bridge is based on the calculated probabilities of a single actor controlling ≥ ½ of the validators selected to vote on Eth1Data during the Eth1Data poll. If a majority of proposers vote in invalid Eth1Data, the Eth1-Eth2 bridge risks processing fake deposits or permitting validators to double-spend deposits.

[Previous analyses](https://ethresear.ch/t/on-the-way-to-eth1-finality/7041)reveal low probabilities of an adversary controlling the majority of proposers voting in the Eth1Data poll, suggesting the Eth1-Eth2 bridge is (mostly) secure in its current form. But we also noticed that the safety of the bridge can be compromised if a slightly lower fraction of the active validator set is dishonest. In other words, the Eth1-Eth2 bridge is not secured by the core protocol and doesn't derive safety properties from the Beacon Chain's finality gadget ([Casper FFG](https://eth2book.info/capella/part2/consensus/casper_ffg/)).

EIP-6110 introduces an in-protocol deposit processing mechanism that requires all validators to validate deposit transactions originating from the execution layer. This increases the threshold of validators that an adversary must corrupt to exploit the deposit processing mechanism from 47% to 66% (⅔ of validators weighted by stake) and ensures deposit processing is as secure as the Beacon Chain itself.

If ⅔ of validators are acting correctly (i.e., validating deposits from execution payloads), a block containing invalid deposit operations will be rejected by the protocol. It also takes just one honest whistleblower to publish evidence of a block including invalid deposit operations to slash the ⅓-n validators that attested to that block.

The honest-majority security model also improves the liveness of deposit processing: in the current Eth1-Eth2 bridge, a dishonest minority of proposers can vote incorrectly or refuse to vote Eth1Data to block processing of deposits. In-protocol deposit processing eliminates the need for an Eth1Data poll so that deposit processing can only halt if ⅔ of validators collude to finalize blocks that fail to include deposits supplied by the deposit contract.

Since the Merge, the execution and consensus layers operate synchronously (Beacon blocks include execution payloads and validity of a Beacon block is tied to the validity of the EL payload), preventing attackers from reorganizing blocks to erase records of deposits sent to the deposit contract. Thus a delay of `ETH1_FOLLOW_DISTANCE`to secure deposit processing against the possibility of long-term reorgs on the execution chain is no longer necessary and we can process deposits instantly instead of waiting ~16 hours (or more) to onboard new validators.

It is theoretically possible for longer reorgs spanning several blocks such that an already active validator has the opportunity to re-submit a deposit transaction using ETH sent in an historical block. This is, however, very difficult to pull off in practice since it requires reverting Beacon blocks past one or more finalized checkpoints—an edge-case that can only occur in the following cases:

* **The attacker controls ⅔ of the total staked ETH.**A supermajority of dishonest validators can collude to finalize a block that reverts previous blocks (which may contain deposits from the execution layer) and block a mass slashing event. Slashing requires ⅔ of validators (weighted by stake) to approve the slashing operation.

* **The attacker is willing to burn ETH to perform a safety attack.**Reorganizing (finalized) deposits requires building an alternative chain that reverts canonical blocks and convincing new nodes to join the non-canonical chain. Since validators staked on the other chain will be inactive, the inactivity leak will leak those validators' balances until both chains finalize separately.

The above analysis implies that, with in-protocol deposit processing, the security of the deposits handling mechanism is now tightly coupled with the security of the Beacon Chain itself. This allows for reducing the delay on deposit processing without introducing any of the security issues that the previous design was supposed to correct.

Another reason we can shorten the processing time for deposit transactions (besides removing the Eth1 follow distance and Eth1Data voting period) is that in-protocol deposit processing removes the need for complex verification of deposit data by validators on the consensus layer. Currently, each validator is required to maintain a copy of the deposit Merkle tree and verify Merkle proofs proving inclusion of deposits against the root of the Merkle tree.

Under EIP-6110, the responsibility for verifying the inclusion of deposits in the deposit contract shifts to the execution client and validators aren't required to verify Merkle proofs to process deposits. This creates an opportunity to (safely) increase the number of deposits that can be processed per block.

EIP-6110 deprecates the `MAX_DEPOSITS_PER_BLOCK = 16`preset and specifies using the block's gas limit to constrain deposit operations in blocks. According to [analyses from the specification document](https://eips.ethereum.org/EIPS/eip-6110#dos-vectors), the maximum number of deposits that can be processed under EIP-6110 is ~1,200—given the current gas limit—which is a massive increase from the previous limit of 16 deposit operations per block.

EIP-6110 reduces onboarding friction for new validators by making participation in Beacon chain duties independent of the syncing of historical data on the execution layer. As mentioned previously, block proposers are required to include all pending deposits and need to create Merkle proofs to prove inclusion of deposits in the deposit contract's Merkle tree. Attesters also need to rebuild the deposit tree in order to process blocks and verify Merkle branches for deposit operations included in a proposed block.

Creating (valid) Merkle proofs for deposit operations and rebuilding the deposit Merkle tree both require pulling deposit data from event logs—a time-consuming process that involves replaying past transactions and running into several errors when extracting past logs. This creates a hard dependency between the syncing of the execution client's deposit receipts cache and a validator node operator's ability to start proposing/attesting blocks.

EIP-6110 removes the need for validators to process historical deposits before proposing blocks on the Beacon Chain. The consensus layer doesn't require Merkle proof verification for deposits, so a validator—once it has successfully synced the Beacon state—can start proposing blocks and serving up deposits to the rest of the network without having to wait for the attached execution client to sync the deposit contract's history.

[EIP-4881: Deposit Snapshots Interface](https://eips.ethereum.org/EIPS/eip-4881)is a solution to the problem of downloading historical deposit transaction receipts and rebuilding the deposit contract's Merkle tree from scratch before processing Beacon blocks. EIP-4881 introduces a mechanism for clients to store and transmit the minimal amount of Merkle tree hashes required to rebuild the root of the deposit tree at a particular (finalized) block height. This reduces syncing times for new validators and frees up execution clients to prune parts of the chain's history not relevant to processing blocks and transactions.

However, EIP-4881 introduces additional complexity for node operators by forcing the requirements to store and update deposit contract snapshots. This itself can turn out to be a fairly complicated task, and a number of node operators have run into issues with properly syncing the deposit contract snapshots cache—sometimes leading to the creation of invalid blocks (blocks can be invalid if a proposer is creating invalid Merkle proofs for deposits). Plus, not every client uses EIP-4881—some are still using JSON-RPC API to rebuild historical states, which is painfully slow and [prone to errors.](https://docs.alchemy.com/docs/deep-dive-into-eth_getlogs#making-a-request-to-eth_getlogs)

By eliminating the need for proposers to create Merkle proofs for deposits, in-protocol deposit processing (via EIP-6110) allows full nodes to avoid storing deposit Merkle tree data; attesting validators also don't need to keep a local copy of the deposit tree to validate blocks. Finally, newly onboarded consensus nodes only have to reason about importing the execution layer's state and can safely skip on downloading deposit contract event logs during the syncing process.

With the Eth1-Eth2 bridge as the de facto mechanism for processing deposits, consensus clients have to dedicate time to maintaining the following components:

* Eth1Data Fetcher (to query the execution client for deposit contract event logs)
* Deposit contract logs cache (to reduce the difficulty of rebuilding the deposit tree)
* Eth1Data polling algorithm (to implement Eth1Data voting for proposers)
* Deposit contract snapshots cache (to speed up syncing of new nodes and creation of Merkle proofs of deposits)

EIP-6110's deprecation of the Eth1-Eth2 bridge and Eth1Data poll removes the burden on client teams to maintain the aforementioned components. Besides saving on valuable engineering hours debugging issues, clients can also reduce the surface area for software bugs by writing less code and reducing complexity in implementations.

The Beacon Chain's validator registry stores a mapping of validator public keys (`pubkey`) to validator indices (`ValidatorIndex`). The `ValidatorIndex`is different from the `index`described earlier:

* The `index`is associated with a _deposit_and is assigned to each deposit sent to the deposit contract. Two deposits from the same validator will thus have different values in the `index`field.

* The `ValidatorIndex`is associated with a _validator_(or, more accurately, the validator's public key) and is assigned when the Beacon Chain processes the deposit and creates a [validator record](https://github.com/ethereum/annotated-spec/blob/master/phase0/beacon-chain.md#validator)that saves important information about the validator in the Beacon state. The set of information stored per validator record for each validator includes the `pubkey`, `withdrawal_credentials`, and a Boolean value indicating if the validator has been slashed or not (among others).

The validator index is assigned to a validator irrespective of the amount of ETH deposited (deposits less than 1 ETH fail by default before reaching the consensus layer). Other deposits to the same validator will increase the validator's effective balance and don't create a new `ValidatorIndex`. You can see this process in action in the current deposit processing workflow, where we confirm that a validator's `pubkey`isn't included in `validator_pubkeys`(the set of public keys of all deposited validators) when processing a deposit:

A validator's index remains the same throughout the deposit lifecycle in the status quo and doesn't change when chain reorganizations occur. As we finalize pending deposits (during the Eth1Data poll) before processing any deposits, a validator is unlikely to have different values for `ValidatorIndex`in different branches of the [block tree](https://inevitableeth.com/en/home/ethereum/network/consensus/casper-ffg#the-problem-with-forks).

However, EIP-6110 removes the Eth1 follow distance and deprecates the Eth1Data poll. This means pending deposits no longer have the notion of finality at the time `ValidatorIndex`is first created; hence, the same validator can have a different `ValidatorIndex`mapped to its `pubkey`in two competing blocks. This can create issues for clients that rely on the `pubkey-index`cache to perform fast lookups of validator indices when participating in consensus.

The pubkey-index cache has many uses, such as [confirming a proposer is part of the active validator set](https://github.com/ethereum/annotated-spec/blob/master/phase0/beacon-chain.md#get_beacon_proposer_index)when processing a new block. (I encourage reading Navie Chan's _ [Pubkey Cache Analysis](https://hackmd.io/@adrninistrator1/SkHmz972n)_for a comprehensive overview of the usage of the pubkey-index mapping.) However, EIP-6110 breaks the invariant that a single pubkey-index cache will cover _all_lookups of validator indices at every point in the Beacon Chain's state tranisitions.

Take, for example, the validator index lookup that happens when we want to process a new deposit for a previously deposited validator. Here, we cannot rely on a singleton pubkey-index cache because it only captures validator indices from one branch of the block tree. A validator's index can, however, change (making the old `ValidatorIndex`redundant) if the block that processed the initial deposit is reorged and replaced by a new block that assigns a different index to the same validator.

The solution EIP-6110's authors propose is for client teams to [maintain two pubkey-index mappings](https://hackmd.io/@adrninistrator1/SkHmz972n#Background): a "finalizedPubkey2Index cache" containing indices of validators whose initial deposits have been finalized and an "unfinalizedPubkey2Index" cache containing indices of validators whose initial deposits are yet to be finalized. The `unfinalizedPubkeyIndex`cache is maintained for different blocks in the block tree so that, irrespective of which block is finalized first, the client has a mapping of pubkey-index for each validator (which it can use to update the finalizedPubkey2Index cache later).

An alternative is to have a `pending_deposits`queue that accumulates deposits from unfinalized blocks and require Beacon nodes to finalize blocks before processing deposit operations from the `pending_deposits`queue. This strategy adds some complexity since each deposit transaction from the same validator will create a fresh deposit in the `pending_deposits `queue and carry a different `deposit_receipts_index`. In comparison, all deposits to the same validator are accumulated to the validator's index until the validator is eligible to join the activation queue—removing the need to maintain a separate record for every deposit to the same validator.

Currently, deposit data supplied by the deposit contract is stored in historical logs and doesn't induce additional state growth. EIP-6110 requires validators to include deposit data in execution layer (EL) blocks, however, which may trigger the fear that execution clients will require more disk space to store blockchain data post-EIP6110.

EIP-6110 has a section to address concerns around chain data growth and downplays the long-term impact of introducing on-chain deposit data. This is based on analysis of the size of each deposit operation (roughly 192 bytes per deposit: 48 bytes for `pubkey`, 32 bytes for `withdrawal_credentials`, 92 bytes for `signature`, and 20 bytes for `amount`). Accordingly, the increase in chain data from including deposit data in execution payloads is estimated to be around 60MiB per year—here's a relevant quote from the specification:

> At the time of the latest update of this document, the total number of submitted deposits is 824,598 which is 164MB of deposit data. Assuming frequency of deposit transactions remains the same, historic chain data complexity induced by this EIP can be estimated as 60MB per year which is negligible in comparison to other historical data.

It's also important to note that removing the need to store deposit receipts will offset some of the state growth from storing deposit data on-chain. While EIP-4881 already allows full nodes to prune parts of the execution chain's history, EIP-6110 takes it one step further by totally removing the requirement for validators to run execution nodes in archive mode and preserve archival data.

EIP-6110 increases the number of deposits processed per block by removing the hard cap of `MAX_DEPOSITS_PER_BLOCK = 16.`The maximum number of deposit operations per block is now governed solely by the block size limit. In theory, removing the limit on deposit operations can widen the surface area for denial-of-service (DoS) attacks on the consensus layer; for example, a malicious validator can send deposit transactions with invalid signatures (consensus nodes must verify each signature before processing a deposit because the deposit contract cannot verify BLS12-381 signatures) and slow down block processing.

That said, EIP-6110's authors [note](https://eips.ethereum.org/EIPS/eip-6110#consensus-layer-1)that a DoS attack exploiting the high limit for deposit operations is unsustainable for a simple reason: the deposit contract only accepts transactions that deposit 1 ETH (or more) as an anti-spam measure. This places a significant cost on DoS attacks—if an attacker would slow down block processing by 1.2 seconds (by packing 1,271 deposits with invalid signatures into a block), it needs to spend a 1271 ETH on deposit transactions. (Note that this doesn't account for the cost of gas for including each deposit transaction in the execution layer block.)

The "1 ETH per deposit transaction" rule protects the consensus layer from DoS attacks after EIP-6110 is activated. But it doesn't protect the execution layer from attackers that spam the deposit contract with invalid transactions. Does this mean DoS attacks are viable on the execution layer? Not really. As the EIP-6110 specification [explains](https://eips.ethereum.org/EIPS/eip-6110#execution-layer-1), anyone interacting with the deposit contract will incur certain fixed costs (e.g., the base fee of 21,000 gas), which should deter potential abuse.

Batching deposit transactions (which large staking pools [already do today](https://docs.kiln.fi/v1/tools/eth-batch-deposit-contract)) may reduce the cost of interacting with the deposit contract—for example, writing to "warm" storage slots (i.e., storage slots modified during a transaction's execution) is cheaper than writing to "cold" storage slots (i.e., storage slots that haven't been touched during a transaction's execution). This "economies of scale" can be exploited by a savvy attacker and create a DoS vector that exploits the higher limit for deposit transactions on the execution layer.

Nevertheless, we can derive some fundamental limits on how cheap deposit transactions can get and how many deposit transactions can be packed in a block by evaluating a number of factors like the gas limit cost of gas per byte of `msg.data`and `calldata`, and the total bytes consumed by a deposit transaction's `DepositData`. Current estimates from the [EIP-6110's security considerations section](https://eips.ethereum.org/EIPS/eip-6110#dos-vectors)suggest the lowest cost of a deposit transaction based on this analysis is enough for security against DoS vectors.

EIP-6110 permits execution payloads to include up to 1,271 deposit operations, which may have some impact on the time it takes to validate and process blocks. However, data from early attempts to stress-test execution clients by simulating blocks with a high number of deposits reveals a moderate impact on block processing and validation.

Specifically, the performance of execution clients like Lodestar and Besu when processing blocks with > 700 deposits doesn't deviate too sharply from established baselines as discussed in [a section of the deposit reform prototype](https://hackmd.io/@n0ble/deposit-reform-prototype#Stress-testing)document (authored by the EIP-6110 team). Below is a relevant quote from the document:

> Compared with the current mainnet profiling, some overhead is associated with the validateDeposits method noticed within block body validation. However, this increase isn't alarming. Block body validation is estimated to take about 2-3 times longer with EIP-6110 deposits than on the current mainnet, yet it's still a minor part of the overall block processing in Besu.

Consensus clients may be required to handle higher deposit processing workloads once EIP-6110 is active since the `MAX_DEPOSITS_PER_BLOCK`constant, though. Particularly, the authors of EIP-6110 suggest client developers should aim to support up to 1,900 deposits per block for robustness.

EIP-6110 is part of the overall drive to reduce tech debt accumulated from the early years of the Beacon Chain's design and pave the way for a robust, secure, and simple Proof of Stake consensus on Ethereum. The proposal introduces in-protocol processing of deposits and deprecates the Eth1Data poll and Eth1-Eth2 bridge, which promises to improve the deposit UX for solo stakers and professional node operators alike—in addition to simplifying things for teams maintaining consensus clients.

More importantly, EIP-6110 increases the safety threshold of the deposit processing mechanism and improves the Beacon Chain's economic security. Validator deposits are now secured by the core protocol and derive liveness and safety properties from the Beacon Chain's finality gadget, which resolves long-standing debates around the weakness of the Eth1-Eth2 bridge. As a wise man (yours truly) once said: the best bridge is no bridge at all.

If you've enjoyed reading this article, consider sharing it with someone who may find it informative and subscribe to [Ethereum 2077](https://ethereum2077.substack.com/). The EIPs For Nerds series will continue next week with a deep dive on [EIP-7503 (Zero-Knowledge Wormholes)](https://eips.ethereum.org/EIPS/eip-7503): an attempt to brings anonymous transactions to Ethereum's base layer and fix the weaknesses of Tornado Cash and other application-layer approaches to financial privacy.

_**Acknowledgments: Thanks to the [Lido (LEGO) grants program](https://lido.fi/lego)and [Ethstaker](https://ethstaker.cc/)for providing a grant to support my work on the EIPs For Nerds project. I'd also like to give a shout-out to [Mikhail Kalinin](https://twitter.com/mkalinin2)who answered my questions and helped throughout the process of researching EIP-6110.**_
