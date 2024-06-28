---
title: eip-7002-execution-layer-exits
pubDate: 06/28/2024
author: Emmanuel Awosika
tags:
  - Defi
imgUrl: '../../assets/EIPs For Nerds  2- EIP-7002 (Execution Layer Triggerable Exits).webp'
layout: '../../layouts/BlogPost.astro'
---
Ethereum's transition from Proof of Work (Pow) to Proof of Stake (PoS), a.k.a., The Merge, was a key moment in the network's history. Besides giving Ethereum a much-needed rebrand by reducing its carbon footprint, Proof of Stake was crucial to a key long-term goal: reducing the barrier to participating in Ethereum's consensus. The Merge replaced computational resources (mining power) with financial capital as the basis of Ethereum's economic security—opening up the opportunity for anyone to profitably and easily run a validator node by staking 32 ETH on the Beacon Chain.

While Proof of Stake has brought benefits, there are still many areas of improvement. Some of these include:

* Reducing stake centralization and validator cartelization
* Minimizing operational overhead for validators and incentivizing solo staking
* Improving staking economics and user experience (UX)
* Enhancing simplicity, security, and decentralization of delegated and multi-party staking operations

[EIP-7002: Execution Layer Triggerable Exits](https://eips.ethereum.org/EIPS/eip-7002)is a new Ethereum Improvement Proposal (EIP) that fixes some of the aforementioned problems. The EIP introduces a mechanism for stakers to exit validators from the Beacon Chain using withdrawal credentials instead of relying on a validator's signing key to trigger exit operations—effectively decoupling a validator's signing key from the withdrawal key.

This "separation of concerns" between validator signing keys and withdrawal keys has a critical benefit: reducing trust assumptions in delegated staking by enabling withdrawal credentials to retain control of staked ETH. I'll explore why this feature is necessary over the course of this article and discuss other benefits of EIP-7002, especially for solo staking and DVT (distributed validator technology) staking. The article will also consider some potential drawbacks of implementing EIP-7002 on Ethereum.

Let's dive in!

If you want to stake ETH and validate the Beacon Chain today, you have two primary options: **solo staking**and **delegated staking**; there are other avenues for staking ETH, but these more or less exist on a spectrum between the aforementioned options. Solo staking is straightforward:

* Deposit 32 ETH into the [Beacon Chain deposit contract](https://etherscan.io/address/0x00000000219ab540356cbb839cbe05303d7705fa)to activate a new validator
* Generate keys for performing validator duties (verifying transactions, attesting to blocks, aggregating attestations, and proposing blocks)
* Set up a validator node and sync an execution layer (EL) and consensus layer (CL) client
* Keep your validator online and properly functioning to avoid penalties

There are more steps (the Staking Launchpad's [Validator FAQ](https://launchpad.ethereum.org/en/faq)has a great overview for prospective validators), but these are roughly the most important aspects of launching a validator. Importantly, solo staking requires no middleman or counterparty and allows you to keep 100% of rewards received from validating (attesting to blocks and proposing blocks) on the Beacon Chain. But it's not a free lunch: you have the responsibility of managing your validator and will need some level of technical expertise to run a solo staking operation.

If the idea of managing a validator sounds difficult, you can go the delegated staking route. You're still responsible for providing 32 ETH to register a new validator—only now, you _delegate_the responsibility of operating the validator to a third-party. The validator node operator is providing what some would describe as a "white glove service" and requires compensation for this service. For example, you may be required to share a part of your validator's rewards with the node operator as part of the initial agreement.

The "white glove" part means the operator assumes responsibility for keeping your validator operational and secure—which means you can do things like stream Netflix on a Friday night (or whatever you do in your free time) without worrying about penalties from missing validator duties or worrying about the safety of your validator keys.

There's a caveat, though: Delegated staking requires trusting the node operator to avoid putting your 32 ETH at risk by committing a slashable offense (e.g., signing two conflicting blocks) or outright stealing your funds. It's a lot to ask—and definitely not for people with trust issues—but the arrangement works out well most of the time _when node operators are honest_.

But Ethereum wasn't built on web2's "trust me bro" ethos, which is why you see "trustless" and "trustlessness" appear frequently in conversations on crypto-Twitter and Reddit. Delegated staking in its purest form conflicts with this ethos, but there's a workaround from the way keypairs are generated during the process of activating a new validator.

Each validator has two keys: a **withdrawal key**and a **validator key**. The withdrawal key is a public-private key pair required to partially or completely withdraw the balance of a Beacon Chain validator depending on whether you want to "skim" (withdraw only rewards) or "exit" (withdraw the 32 ETH balance + rewards). Note that the withdrawal key must be updated from the default BLS (`0x00`) credentials to `0x01`credentials that point to an Ethereum address to enable partial or full withdrawal of a validator's balance.

The withdrawal key is generated at the time of depositing via an interface like the [Staking Launchpad](https://launchpad.ethereum.org/en/)and hashed to create a `Withdrawal ID`that is included in the `deposit data`of the validator—which provides the Beacon Chain with information about who deposited the 32 ETH. The infographic below from _ [Protecting Withdrawal Keys](https://www.attestant.io/posts/protecting-withdrawal-keys/)_by Attestant provides a great overview of how the withdrawal key is integrated into the validator deposit process:

The validator key is a public-private keypair required for executing the duties expected of every Ethereum validator—primarily voting for blocks and proposing blocks for others to vote on ("voting" and "attesting" are used interchangeably, but refer to the same concept of verifying transactions and confirming validity of blocks). The validator's public key serves as its unique cryptographic identity in Ethereum's consensus protocol, while the private key is expected to be hidden and used for signing block data (validator keys are also described as **signing keys**for this reason).

Now, for the main difference between validator (signing) keys and withdrawal keys:

A validator's signing key is used frequently—think every 6.5 minutes or the length of a slot during which every validator will be selected to attest or propose a block—and best kept in an online, easy-to-access location like a hot wallet. However, a withdrawal key is used less frequently and can be kept in a secure, offline location like a cold wallet until a staker wishes to withdraw funds from the withdrawal address associated with a particular validator.

This distinction is crucial for reducing trust assumptions in a delegated staking setup: as the withdrawal key is not required for validation duties, a staker can retain control of staked ETH by sharing the validator key with the node operator and holding the withdrawal key. That way, a rogue operator cannot run away with a staker's funds after withdrawing a validator's balance without the staker's approval.

Delegated staking arrangements, where the staker holds the withdrawal key, are typically described as "non-custodial " to reflect that the entity operating the validator node on the staker's behalf ultimately has no control of staked ETH. This stands in contrast to custodial staking solutions in which the staking service controls both signing and withdrawal keys; "white glove service on steroids" is a good mental model for custodial staking: a staker simply provides 32 ETH to fund the validator and delegates everything else—including initiating validator deposits and storing withdrawal keys—to the staking service).

Separating validator signing keys from withdrawal keys theoretically solves the problem of trust in delegated staking agreements. In practice, the relationship between node operator and staker in a non-custodial staking setup _still_has an element of trust due to the current mechanism for exiting a validator and triggering a full withdrawal of the validator's balance to the withdrawal address.

To exit a validator from the Beacon Chain, a "Voluntary Exit Message" (VEM) **signed with the validator key**must be submitted for processing on the consensus layer. Once included in a block (each block can include a maximum of 16 exit operations), the exit message is added to the [exit queue](https://medium.com/intotheblock/understanding-the-exit-queue-on-ethereums-shanghai-upgrade-cdb4dc029564)—with the delay on the final withdrawal influenced by factors, such as y the number of queued exits or validator churn rate.

I emphasized the requirement to sign a voluntary exit message with the validator's signing key to highlight a problem with existing "non-custodial" staking solutions: a staker must rely on the node operator—who controls the validator key required to sign a VEM—to process withdrawals. This effectively re-introduces trust into the relationship between node operators and staking services; worse, it places stakers at the risk of getting "griefed" by malicious node operators.

In a [griefing attack](https://ethereum.stackexchange.com/questions/62829/what-does-griefing-mean), the attacker's goal is to cause losses for the other party—not necessarily to benefit directly. To put this into context, consider the scenario where Alice delegates Bob to operate a validator on her behalf but decides to withdraw her 32 ETH later. Bob could honor Alice's request and trigger a withdrawal by signing a Voluntary Exit Message (VEM)...or refuse to sign the exit message and stall Alice's withdrawal operation. Bob won't directly benefit from refusing Alice's request—all he can do is hold Alice's ETH "hostage" by declining to help Alice exit her validator.

Okay, that's not 100% accurate; Bob can do many bad things to cause Alice even more "grief":

1. **Reduce Alice's validator balance by deliberately committing a slashable offense or incurring penalties.**The individual penalty for failing validator duties (e.g., missing attestations) or committing a slashable offense (e.g., signing two conflicting blocks in the same slot) is typically low but increases in proportion to the number of validators that commit similar infractions in the same period. For example, missing one or two attestations will reduce a validator's balance by a small fraction, but that reduction increases exponentially if an [inactivity leak](https://www.cryptofrens.info/p/the-inactivity-leak)—where multiple validators are offline—occurs.

Under the current mechanism, a malicious Bob can reduce Alice's validator balance of 32 ETH up to 50 percent by incurring penalties and slashings until the validator is forcefully exited from Beacon Chain consensus (after its effective balance drops to 16 ETH). If we use 1 ETH = $2,000, Bob's griefing attack will cost Alice at least $32,000 (16 ETH) in a normal case (no correlated penalties) and $64,000 (32 ETH) in the worst-case scenario (i.e., where the _entire_balance can be slashed due to correlation penalties).

> _He who can destroy a thing, controls a thing. — Paul Atreides (Dune)_

2. **Demand a ransom from Alice in exchange for not committing a slashable offense.**This doesn't exactly align with the previous definition of griefing, but consider that Bob's only recourse is to burn ETH if Alice decides to play hardball. The situation is thus different from more common types of attack where the goal is (always) to profit with minimal loss.

_Note: Bob (the node operator) may actually be honest in this scenario, but an adversary could compromise the validator key and hold Alice's ETH hostage. This explains the "counterparty risk" that users of a staking-as-a-service (SaaS) platform must bear and is another reason solo staking—with its "trust no one but thyself" ethos—is considered the gold standard for Ethereum stakers._

Does this mean every non-custodial staking service is actually not non-custodial? Not exactly. A simple workaround is for the staking service to sign a voluntary exit message _in advance_—preferably once the validator is activated on the Beacon Chain—which the staker can submit independently to an Ethereum consensus node whenever it wishes to withdraw.

By [pre-signing voluntary exits](https://mirror.xyz/ladislaus.eth/wmoBbUBes2Wp1_6DvP6slPabkyujSU7MZOFOC3QpErs&1)for a staker, the arrangement between a staker and a node operator returns to the original non-custodial status. However, pre-signed exit messages are not sustainable for many reasons:

Pre-signed exit workflows require more communication between a staking service operator and the stake delegator: you have to submit a request for an exit message and wait for the staking service to send the signed exit. There's also the problem of security when using and exchanging pre-signed exits:

* A staking service must take extra precautions—like encrypting the exit message and sharing it over a secure (off-chain) communication channel—to prevent the exit messages from falling into the wrong hands.

* A staker must take extra precaution to store the exit message in a secure location as losing the exit message is equivalent to potentially losing the ability to independently withdraw the validator's balance.

Additionally, pre-signed exit messages are currently valid for two Ethereum forks or ~12 months—if you expect forks to happen roughly every six months. This means a staker has to re-submit a request for a voluntary exit to the staking service operator multiple times in a calendar year. This will no longer be the case when [EIP-7044](https://eips.ethereum.org/EIPS/eip-7044)is implemented and signed validator exits become valid indefinitely, however.

EIP-7044 fixes the issue of expiring exit messages, but it introduces a new set of problems—particularly for large staking pools. For background, the current approach in decentralized staking pools is to require new validator node operators to submit pre-signed exits before getting funded by the pool. Here, signed exits provide cryptoeconomic security since it reduces the power an (untrusted) operator has over validator funds; a staking pool can trigger the exit of an uncooperating validator node operator by submitting the pre-signed exit on-chain.

But a validator node operator won't exactly feel comfortable if pre-signed exits are stored on a random server due to the risk of someone accidentally/deliberately triggering a spurious exit by getting hold of the signed exit message. In a worst-case scenario, forced exits would likely result in a loss for a validator node operator (e.g., if you took out a loan against future Beacon Chain rewards). This means staking pools must take even _more safety_precautions and store exit messages securely, especially in a post-EIP 7044 world where signed exits have infinite expiry dates.

A potential solution is to encrypt signed exit messages with a shared public key generated via a [DKG (Distributed Key Generation) protocol](https://en.wikipedia.org/wiki/Distributed_key_generation), and require a quorum of keyshares to reconstruct the private key before the exit message can be decrypted. This reduces the trust assumption that comes with one party storing exit messages, provided no one controls enough keyshares to unilaterally decrypt the pre-signed exit without input from other participants. But an edge case appears if one or more private key shares are misplaced, lost, or stolen—making it difficult, or outrightly impossible, to decrypt the signed exit message if triggering a validator's withdrawal becomes necessary.

Staking services have gotten a _lot_of scrutiny from an alphabet soup of regulators, most notably the SEC (Securities and Exchanges Commission) led by crypto's public enemy No. 1: Gary Gensler. For example, Kraken [shut down its custodial staking-as-service operation earlier this year](https://www.sec.gov/news/press-release/2023-237#:~:text=In%20February%20of%20this%20year,Elizabeth%20Goody%20and%20Jennie%20B.)and paid $30 million in fines for "offering unregistered securities through its crypto staking platform."

In theory, a non-custodial staking service is unlikely to get caught in the SEC's crosshairs due to the non-custodial nature of its arrangement with the stake owner:

1. The 32 ETH (or multiples of 32 ETH) deposit for activating a validator comes from a withdrawal address controlled by the staker—and the protocol identifies the withdrawal address as the owner of the 32 ETH deposit. This means a non-custodial staking service cannot withdraw the validator's balance and "commingle customers' money with its own" as Kraken was accused of doing by the SEC.

In an exchange like Kraken, a user's wallet balance is "virtual" since all customer funds are held in one or more wallets controlled by the exchange. So if you stake 32 ETH via a custodial staking service run by an exchange, what you _really_have is an IOU from the exchange promising to pay back 32 ETH (plus a percentage of validator rewards) whenever you wish to withdraw.

2. Stakers can independently withdraw funds by submitting pre-signed exits without running the risk that a rogue staking service will prevent withdrawals. In contrast, a custodial staking service—especially an exchange like Kraken—has control of a staker's assets and can block withdrawals for arbitrary reasons.

These two facts obviate the need for "investor protection"; I'm not a policy expert, so excuse any errors in this line of reasoning. But there might still be a small wrinkle or two if you're running an institutional, non-custodial staking service today:

* For the short (or probably long) period between activating a validator and sending a pre-signed voluntary exit to the staker, the staking service controls the 32 ETH—which makes it "custodial" in the eyes of a regulator. Further compounding the problem is the short expiry dates of pre-signed exits (pre-EIP 7044): between the time a new exit message is signed and sent to the staker, the validator node operator has some control over the staked ETH.

* While regular exit messages are broadcasted on-chain and publicly verifiable, a pre-signed exit needs to be encrypted and shared off-chain _privately_between the node operator and staker. This makes it more difficult for a third party like a regulator to verify that the staking service _truly_signed an intent-to-exit as part of the initial validator deposit agreement—or if the exchange recurred once the original exit message expired (i.e., pre-EIP 7004).

In summary: pre-signed exits alleviate _some_problems with delegated staking, but are not enough to make staking on Ethereum trustless, secure, and decentralized. To put the "non-custodial" back in non-custodial staking, we need a better solution—which we now have, thanks to EIP-7002. Subsequent sections will cover EIP-7002 in detail and touch on the various advantages of the EIP as well as potential issues associated with implementing it.

[EIP-7002](https://eips.ethereum.org/EIPS/eip-7002)fixes the principal-agent problem in delegated staking—where stakers must trust validator node operators to pre-sign exit messages, or honor future exit requests—by introducing a new voluntary exit operation that can be triggered with a validator's withdrawal credential. This empowers stakers to withdraw staked ETH without relying on the entity holding the validator's signing key (i.e., the staking service in a delegated staking setup) to process withdrawals.

EIP-7002's key feature is the introduction of a stateful **validator exit precompile**that maintains a queue of validator exit messages originating from the execution layer. At intervals, a number of exit messages are removed from the queue and added to the execution payload of a Beacon Chain block. This allows exit messages from the execution layer to be "injected" into the consensus layer and processed as part of Beacon Chain operations—similar to how deposits originating from the deposit contract are passed from the execution layer to the consensus layer for processing.

Exit messages are regular Ethereum transactions with the validator precompile address as the target and indicate intent to exit a validator (identified by its public key). A validator exit message is valid if (a) it is signed by the Ethereum address referenced in the validator's execution-layer (`0x01`) withdrawal credential (b) the validator to be exited is active on the Beacon Chain. These checks are executed by the consensus layer _after_the exit message makes its way to the Beacon Chain; the validator exit precompile only confirms if an exit transaction pays enough gas at the time the exit precompile is called by a staker.

All execution-layer exits are processed the same way as a regular voluntary exit operation triggered from the consensus layer, which preserves invariants around the maximum allowable exits from the active validator exits. EIP-7002's in-protocol mechanism for transferring exit messages between execution and consensus layers also removes the need for connections to a consensus node to trigger exits (which is required for withdrawing validators with pre-signed exit messages). Validators can now be funded and exited from the same execution-layer address, which explains the naming of the EIP as "Execution-Layer Triggerable Exits".

Having seen how EIP-7002 works at a high level, we can now delve into the finer details of the EIP. The next section will cover the [current specification of EIP-7002](https://eips.ethereum.org/EIPS/eip-7002)and discuss key aspects of the validator exit mechanism. If you'd rather skip the technical discussion and explore the advantages of implementing EIP-7002, you can skip to the next section—which highlights some of the improvements to staking user experience (UX) that EIP-7002 enables.

Per EIP-7002, a validator exit operation (defined in pseudocode as `trigger_exit()`) is a `CALL`to the validator exit precompile address. The transaction field for calls to the validator exit precompile has two values:

* `source_address`: A 20-byte value representing the withdrawal address that initiated the transaction
* `validator_pubkey`: A 48-byte value representing the public key of the validator to be exited

After a staker calls the exit precompile with the `validator_pubkey`as input, the validator exit compile runs the following operations (I'll go over key parts of this operation subsequently):

* Confirms the transaction pays enough gas to cover `EXIT_FEE&#xA0;`
* Increases the exit counter (`EXIT_COUNT`) by one for the current block
* Inserts the exit message into the queue
* Increases excess exits for the current block (`EXCESS_EXITS`) by one
* Refunds the caller—if they overpaid for gas—by forwarding a stipend of 2300 gas (`EXCESS_RETURN_GAS_STIPEND`)

An important detail: the validator exit precompile doesn't check if `source_address`is a valid withdrawal address for the validator identified by `validator_pubkey`, nor does it check if `validator_pubkey`. This exposes a subtle security issue that can arise if an attacker fills up the queue with messages that are doomed to fail; this is primarily a griefing attack with the objective of preventing processing of legitimate exit messages. EIP-7002 addresses this problem by charging a dynamically adjusting fee on exit transactions (the exit fee mechanism is discussed later).

`MAX_EXITS_PER_BLOCK`is the number of execution-layer exits that can be included in a Beacon Chain block. This value is currently set to `16`to mirror similar operations on the Beacon Chain, such as `VoluntaryExit`(exit operations triggered directly from the consensus layer with a staker's validator key).

The specification also notes that setting `MAX_EXITS_PER_BLOCK`to `16`bounds the size of execution payloads—and by extension, the size of Beacon Chain blocks—and reduces the overhead of processing exit operations on the consensus layer. This is useful since we can expect some stakers to continue exiting validators using the current mechanism of triggering exits from the consensus layer (i.e., via pre-signed exits or real-time voluntary exit messages).

EIP-7002 theoretically allows up to 16 execution-layer exit operations to be included in a block, but targets a more conservative estimate of two exits per block. [Per the specification](https://eips.ethereum.org/EIPS/eip-7002#target_exits_per_block-configuration-value), `TARGET_EXITS_PER_BLOCK`has been set to `2`to bound the churn rate of validators and preserve the invariant on maximum allowable exits per epoch defined by the Beacon Chain's `get_validator_churn_limit()`function—even in situations where all the ETH in circulation is staked.

`EXIT_COUNT`is the number of exit messages included in the current block. After each successful call to the validator exit precompile, the value of the `EXIT_COUNT`variable stored in the validator precompile's storage is increased by one (defined in pseudocode as `increment_exit_count()`).

At any point in time, the value of `EXIT_COUNT`will lie between `TARGET_EXITS_PER_BLOCK`(`2`) and `MAX_EXITS_PER_BLOCK`(`16`) depending on how many exit operations are added to the block's execution payload. `EXIT_COUNT`is also an input to the function that calculates the amount to be paid by a new exit operation (`EXIT_FEE`).

`EXCESS_EXITS`is the difference between `MAX_TARGET_EXITS`and `TARGET_EXITS_PER_BLOCK`—the number of exits left unused by the current block. As mentioned, each block can include a maximum of 16 exits but targets two exits in normal situations, so `EXCESS_EXITS`is equivalent to "the difference between how many exits a block can theoretically consume and and how many exits it actually uses."

The exit precompile's excess exits counter is updated based on the last block's usage and is one factor (among others) that determines the fee paid by a transaction that calls the validator exit precompile. This ensures exit fees are priced according to current usage, which is similar to [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559)calculating the `base_fee`for a new block is calculated based on the difference between the target gas limit and the gas used by the previous block.

`EXIT_MESSAGE_QUEUE`is a list of _all_pending exit messages (arranged in order of arrival) currently stored in the validator precompile's `EXIT_MESSAGE_QUEUE_STORAGE_SLOT`. The number of exit messages in the queue can be unbounded, but the `MAX_EXITS_PER_BLOCK`variable rate limits how many pending exits can be de-queued into each block.

The exit message queue maintains a "head" and a "tail" index—both simply referring to the set of messages near the start and end of the queue—that is updated after each block to account for the processing of one or more exit messages. This is a first-in-first-out (FIFO) queue, so messages get executed according to when they are added to the queue—which has security implications, especially around the griefing of honest validators.

`EXIT_FEE`is the amount an address calling the validator exit precompile to exit a validator must pay in _gas_. Before inserting an exit message to the queue, the validator precompile checks that the gas fee attached to the transaction equals or exceeds the current value of `EXIT_FEE`—if the transaction has leftover gas after executing successfully, the sending address is credited with exactly 2300 gas.

According to the specification, this design follows the now-deprecated feature in Solidity, where invoking the `fallback()`function in a destination contract or sending ETH via `transfer()`or `send()`forwards a stipend of 2300 gas to the recipient. Changes in gas costs (starting with the Berlin/Istanbul fork) have reduced the utility of this feature (read _ [Stop Using Solidity's transfer() Now](https://consensys.io/diligence/blog/2019/09/stop-using-soliditys-transfer-now/)_for some context), but the original idea of a simple gas accounting system is still useful. In the context of EIP-7002, sending a fixed refund of 2300 gas simplifies the fee mechanism for the validator exit precompile.

The alternative is to design a special mechanism that allows the exit precompile to return the maximum amount of gas left over from a transaction. This would make sense, especially in cases where the withdrawal address is an EOA—smart contracts can calculate precise values for `EXIT_FEE`by checking the precompile's state , but EOAs will likely send more gas for each call to the precompile address. This route adds more complexity to the design of EIP-7002 vs. using a simple `CALL`to forward a fixed amount of gas as a refund; although, EIP-7002's authors [suggest this feature may be included in the final specification](https://eips.ethereum.org/EIPS/eip-7002#utilizing-call-to-return-excess-payment)depending on feedback from stakeholders.

The calculation of `EXIT_FEE`is where things get interesting. The exit fee is dynamic and designed to respond to network conditions, similar to the base fee introduced by EIP-1559, and is a function of three variables:

* The minimum (base) exit fee: `MIN_EXIT_FEE`
* Number of excess exits at the current block: `EXCESS_EXITS`
* The exit fee update formula: `EXIT_FEE_UPDATE_FRACTION&#xA0;`

Like EIP-1559's `base_fee`, the validator exit precompile's exit fee is a rate-limiting mechanism: in the average case (two exits per block), anyone calling the validator exit precompile can expect to pay the minimum exit fee, but the cost of an exit operation progressively scales up as more exits are included in a block. This can be deduced from EIP-7002's [formal specification for updating the exit fee](https://eips.ethereum.org/EIPS/eip-7002#exit-fee-update-rule): `exit_fee = MIN_EXIT_FEE * e**(excess_exits / EXIT_FEE_UPDATE_FRACTION)`.

An explanation of the exit fee mechanism from the specification:

> "The block-by-block behavior is roughly as follows. If block `N`processes `X`exits, then at the end of block `N` `excess_exits`increases by `X - TARGET_EXITS_PER_BLOCK`, and so the `exit_fee`in block ` N+1`increases by a factor of `e**((X - TARGET_EXITS_PER_BLOCK) / EXIT_FEE_UPDATE_FRACTION)`. Hence, it has a similar effect to the existing EIP-1559, but is more "stable" in the sense that it responds in the same way to the same total exits regardless of how they are distributed over time."

By progressively increasing the exit fee according to the usage of validator exit precompile, EIP-7002 reduces the risk of an attacker deliberately filling up the exit queue to prevent other validators from exiting. Recall messages in the exit queue are dequeued and in first-in-first-out (FiFo) style as opposed to, say, last-in-first-out (LiFo) or highest-paying-transaction-first order. While we can assume the gas prices will prevent unnecessary calls to the exit precompile, a malicious attacker may be willing to pay more gas to "stuff" the exit queue and push another validator's exit message to the end of the queue.

The problem is further compounded by the centralization of block building in post-Merge Ethereum. If an attacker is integrated with one or more dominant builders (for context:[80-90% of blocks to date on Ethereum have been produced by 4-5 builders](https://mevboost.pics/)) and is willing to pay for top-of-the-block inclusion, they can effectively frontrun exit messages from one or more stakers and prevent timely exits of validators from the Beacon Chain.

And why would _anyone_go through all that stress? A possible motivation might be that the attacker wants to grief stakers that wish to exit validators using withdrawal credentials. To use the previous example of Bob the (malicious) node operator and Alice the staker: Alice can quickly exit her validator to stall Bob's griefing attack by calling the validator exit precompile with the withdrawal credential—but Bob can still give himself more time to leak Alice's validator balance by spamming the validator exit precompile and delaying Alice's exit message.

EIP-7002's dynamic pricing formula makes Bob's griefing attack more costly by exponentially increasing the exit fee as more exit messages are dequeued into Beacon Chain blocks (note: Bob isn't the only one trying to exit validators). This will increase the exit fee to the point where sending an exit message is too costly; usage will expectedly afterwards, after which the exit fee will return to equilibrium levels.

EIP-7002 slightly changes the structure of Beacon blocks by requiring block headers to include an `exits_root`value. `exits_root`is the root of the Merkle trie (i.e., exits trie) that commits to the list of exits included in a block (see [this section of my post on Verkle trees](https://ethereum2077.substack.com/i/139794043/what-is-a-merkle-tree)for the usefulness of Merkle trees in verifying data); the exit trie is expected to correspond to the list of exit messages at the head of the exit queue—up to `MAX_EXITS_PER_BLOCK`.

EIP-7002 also adds a new validity condition for blocks. First, the list of exits (`exits_trie`) cannot exceed `MAX_EXITS_PER_BLOCK`. Second, the list of exits must correspond to the number of exit messages dequeued from `EXIT_MESSAGE_QUEUE`when such messages are arranged in first-in-first-out (FiFO) order.

EIP-7002 has a function (`expected_exit`) for confirming that a block doesn't include more exits than the result of computing `NUM_EXITS_IN_QUEUE - MAX_EXITS_PER_BLOCK`. Also, a consensus node re-executing the block will independently compute the `exits_root`by iterating over the list of exits in the block's body and comparing the root of the hashed list with the `exits_root`stored in the header of the proposed Beacon block.

In the introduction, I noted how reliance on a validator's signing key to initiate validator exits introduced the problem of trust; I didn't include a definition of trust, but this definition from Vitalik's _ [Trust Models](https://vitalik.eth.limo/general/2020/08/20/trust.html)_article sums it up nicely: **"Trust is any assumption(s) you make about the behavior of other people**." By signing up for a staking service, knowing a malicious node operator can freeze withdrawals, a staker is essentially trusting the node operator to act faithfully.

EIP-7002 doesn't totally remove the trust element in delegated staking—you still have to trust a node operator not to execute a griefing attack—but enabling stakers to withdraw with withdrawal credentials reduces the burden of trust to some extent. For example, a user doesn't need to "have faith" that a node operator will sign a voluntary exit message once they request it.

A subtle point about "trustlessness" is that it isn't necessarily about avoiding the need to trust, but about _not needing to trust_because (a) there are strong incentives for all parties to act honestly (b) honest parties have some amount of protection from the actions of dishonest parties. The ability to exit a validator with withdrawal credentials is an example of the latter: Bob may try to grief Alice, but now Alice has the agency to withdraw her validator, hopefully before Bob does any more damage.

Currently, staking pools have no way of forcing a validator node operator to exit—which puts pool contributors in the uncomfortable position of trusting node operators to act honestly. Some decentralized staking pools require node operators to provide a bond, but given the possibility of a malicious operator getting slashed to 0 ETH, the security from a bond might be inadequate in the eyes of a risk-averse staker.

With EIP-7002 in place, staking pools can greatly reduce trust assumptions by complementing the security from the threat of slashing a node operator's collateral with procedures for forcefully exiting a misbehaving operator via an execution layer exit. The possibility of withdrawal credentials pointing to a smart contract address (instead of an EOA) also opens new incident response designs for staking pools—for example, a smart contract could automatically submit an exit message if an operator incurs higher-than-average penalties within a time window. This requires trusting an oracle to track validator performance, and a [keeper network](https://seasaltyfunk.medium.com/what-are-keepers-why-they-are-a-critical-part-of-blockchain-infrastructure-57de9d08fef6)to trigger the smart contract, however.

The other hypothetical benefit for a staking pool from implementing EIP-7002 is obviating the need to request and store pre-signed exit messages, which comes with risks as I've explained previously (e.g., unauthorized access to exit messages could result in unexpected validator exits). This also contributes to the goal of designing trustless staking pools: as opposed to relying on pre-signed exits stored by a few (trusted) individuals, a smart contract designated as the withdrawal address could be controlled by governance—enabling the community to decide to exit a node operator publicly and transparently.

* **DVT reduces barriers to solo staking**: Multiple solo stakers can pool funds together to jointly activate a validator without having to trust every other party. Multiparty computation (MPC) schemes can tolerate up to ⅓ faulty nodes—so if a hypothetical distributed validator requires 3-of-5 keyshares to reconstruct the validator's signing key, signing can happen if two DVT nodes are offline.

* **DVT improves fault tolerance and resilience for institutional/solo staking setups**: As mentioned above, a validator's signing key can be split into different keyshares and reconstructed only when signing block data is required. This reduces the risk of a hacker compromising the validator's signing key, or a staker losing access to funds because the device storing the signing key suffered damage.

However, DVT setups _still_carry some risk for stakers due to the way withdrawals and exits currently work on the Beacon Chain. If some DVT nodes misplace keyshares or refuse to participate in the threshold signing scheme, exiting a validator becomes impossible—especially when:

* Keyshares for each participant in the DVT setup are generated at the time of activating a validator and cannot be "refreshed" after the initial DKG ceremony (note that a "participant" could simply be another EOA owned by the same staker); some DVT protocols _do_allow for new keyshares to be generated, although this _may_require the remaining keyshares to meet the quorum of signatures required for regular signing.

* The quorum threshold—the number of keyshares required to jointly generate a valid signature for the distributed validator—cannot be changed once the (distributed) validator is active.

Without EIP-7002 providing the option of exiting a validator using the withdrawal key, the benefit of running a DVT setup—independently or in concert with other validators—would be greatly reduced (e.g., a validator balance could be locked forever). EIP-7002 provides a fallback safety option for distributed validators: if reconstructing the signing key is infeasible, the validator can be exited from the Beacon Chain by submitting an exit message signed with the withdrawal key reconstructed from keyshares.

It's unlikely the authors of EIP-7002 explicitly set out with the goal of making it easier to run a regulated institutional staking-as-service company. Even so, the EIP _does_help with the problem of convincing regulators of an institution's non-custody of staked ETH. A staking operator in this scenario could simply present a hash of the deposit transaction signed by the staker's withdrawal key—which can now sign and submit voluntary exits—as proof that funds deposited in a validator are never in its custody _at any point in time_.

I emphasized "any point in time" since, pre-EIP 7044, a node operator temporarily assumes control of the validator's balance after the pre-signed exit expires. And even with EIP-7044's perpetually valid signed exits, node operators still have custody of the 32 ETH deposited for a validator for the short period between the validator's activation and the staker receiving a signed exit message from the staking service operator. EIP-7002 removes these awkward areas and ensures stakers have (provable) custody of funds throughout the validator's lifecycle—from entering the Beacon Chain to exiting and sending funds to the staker's withdrawal address.

A good mental model for EIP-7002 is to think of it as "[account abstraction](https://metamask.io/news/latest/account-abstraction-past-present-future/)for staking infrastructure". For context, a validator key (or signing key) is always an EOA and comes with the same set of constraints around private key safety and usage that affects regular Ethereum EOAs today:

* **Validator (signing) keys are at a higher risk of getting compromised.**Unlike withdrawal keys stored in cold (offline) storage, validator keys are stored in hot wallets connected to the Internet—making them susceptible to phishing attacks. If a validator's signing key is compromised, stakers and delegated staking providers are susceptible to the griefing vectors described in the introduction without any fallback plan—beyond "wait until the balance drops to 16 ETH and the validator is forcefully exited by the protocol".

* **Validator keys have limited options for recovery schemes (lose it once = lose it forever).**Splitting a validator key into multiple keyshares via distributed validator technology (DVT) can mitigate this risk, but running a solo DVT staking setup is non-trivial; plus, as I explained previously, DVT isn't a silver bullet as keyshares can be lost and complicate refreshing of keyshares.

* **Validator keys cannot support more flexible staking designs.**Different staking services have evolved automated/flexible workflows for funding validators due to the benefit of pointing withdrawal credentials to smart contracts. Exiting a validator is, however, a manual process that requires signing a voluntary exit message—the process could be automated by a smart contract that stores pre-signed exits, but that comes with certain trust assumptions and security considerations explained previously.

We can solve most—or at least, some—of these problems once withdrawal keys are capable of exiting validators. For this to work, a staker (or staking pool) will need to complete a one-time change from `0x0`withdrawal credentials to `0x01`withdrawal credentials—while `0x0`credentials are a BLS (EOA) key by default, `0x01`credentials can point to any Ethereum address, including smart contracts and EOAs. Setting a smart contract as the withdrawal address for a validator is great for improving the user experience (UX) of staking:

1. **Withdrawal keys can have flexible recovery mechanisms, like social recovery.**A staker would have one or more "guardians" that can authorize a new key to control the withdrawal smart contract if the original key is stolen or lost—guardians can be friends, relatives, fellow stakers, or a specialized third-party service. Flexibility in recovery mechanisms can particularly benefit solo stakers; you can have a [deadman's switch](https://sarcophagus.io/)that activates an EL exit and sends funds to a designated address if your validator stops attesting for a predetermined period (e.g., because you've "passed on to the Great Beyond").

2. **Flexible staking designs can emerge.**For example, a risk-averse staker may prefer a 2-of-2 multisig withdrawal contract—with the staker and node operator holding one of the two keys required to approve exit requests—instead of storing the entire withdrawal key. It's still non-custodial (a node operator cannot exit the validator without approval), though it requires trusting the node operator not to block a validator's exit by refusing to sign exit transactions proposed by the staker.

For staking pools, flexibility in staking designs could mean implementing withdrawal contracts with arbitrary logic for updating or transferring ownership of validators. In the absence of EIP-7002, the only real way a staking pool can manage ownership of validators is to move pre-signed exits around, which comes with various risks and edge cases.

3. **Validator withdrawals can be** _**safely**_ **automated**. As opposed to storing pre-signed exits in a smart contract, withdrawal contracts can have complex rules governing validator exits; a "mad science" idea is a "time-based staking pool" where node operators are trustlessly rotated. Or consider if a large staking pool like Lido wants to decentralize: governance can elect to exit some validators controlled by a large node operator and redistribute funds to smaller operators (or solo stakers) to reduce choke points from a node operator controlling a sizable number of validators.

These are just some of the early possibilities EIP-7002 enables, but I'm _very_certain more applications will appear—just like how new features and use-cases for smart wallets on Ethereum continue to surface. If you're reading this and have more concrete ideas for applying EIP-7002 to staking designs, feel free to chime in the comments!

In the draft EIP, the authors of EIP-7002 acknowledge potential concerns around enabling withdrawal credentials to trigger validator exits—but go on to say, "we don't know of any staking designs that rely on this feature [i.e., inability of exiting with withdrawal credentials]". This seems reasonable—even I had some difficulty reasoning about any delegated staking arrangement that would require this feature. But just because it doesn't seem obvious, _doesn't_mean it isn't there.

> _"Listen to those quiet, nagging doubts. If you don't know, you don't know what you don't know, you don't know how much you don't know, and you don't know how much you needed to know." — Eliezer Yudkowsky_

To provide some context, I'll include screenshots of a conversation around an [early proposal to implement withdrawal credential-approved exits via a Generalized Message Bus (GMB)](https://ethresear.ch/t/withdrawal-credentials-exits-based-on-a-generalized-message-bus/12516). The GMB is a system-level smart contract whose events are read and processed by clients, like the current deposit contract, and is capable of conveying messages from the execution layer to the consensus layer. While the author(s) hinted at more generic EL-to-CL message types, the main proposed use-case of the EL-to-CL message bus was providing a way to trigger exits from the execution layer via `0x01` withdrawal credentials.

From this exchange, we already have an example of a staker-node operator relationship built on the assumption that the staker cannot exit and withdraw a validator using the withdrawal key. Another example of a potential edge-case of implementing EIP-7002 comes from a conversation around Lido's decentralization plans on the Lido Community Staking Podcast, which you can [watch on YouTube](https://youtu.be/fixMJQ0ahNc). (EIP-7002 is only mentioned briefly (28:55 to 30:00) in the video).

For background, Lido has been described as a "systematic threat to Ethereum" because it controls ~ 33.3% of Beacon Chain validators and could put Ethereum's consensus at risk; for example, if the Lido DAO forced node operators to censor transactions, or revert previously finalized blocks (Mike Neuder's _ [Magnitude and direction of Lido attack vectors](https://notes.ethereum.org/@mikeneuder/magnitude-and-direction)_describes the threat in more detail).

However, one of the speakers in the previously linked episode makes the compelling argument that this attack vector—the DAO forcefully co-opting node operators into an attack on the Ethereum protocol—doesn't exist _yet_, as node operators have some agency. The DAO can withhold the stake of a validator _after_it exits, but cannot rely on the threat of a forced exit to coerce a validator into attacking Ethereum's consensus.

With EIP-7002, the power dynamic changes significantly: withdrawal contracts governed by the DAO can exit an operator against its wishes—giving the DAO leverage over node operators. This type of leverage is useful for protecting a staking protocol against a malicious operator set, as I've explained previously. But it can also be misused in the following scenarios:

* The staking protocol suffers a governance attack and the DAO passes a malicious proposal to trigger a validator's exit from the withdrawal contract
* An attacker assumes control of one or more validators by hijacking ownership of the withdrawal contract and executes a successful blackmail strategy

This is another example of how EIP-7002 could change existing assumptions in staking designs—this time, for node operators validating on behalf of a staking pool like Lido. Nevertheless, this attack vector can be easily mitigated through different methods like using secure, rigorously audited, and possibly non-upgradeable, withdrawal contracts or following [best practices for secure DAO governance](https://www.halborn.com/blog/post/best-practices-for-secure-defi-governance).

To account for the edge case where a node operator suffers losses from a forced exit after refusing an attacker's demands to violate protocol rules, staking pools can take inspiration from real estate companies to protect node operators:

* Before signing a lease, renters are required to provide a "security deposit". The deposit is held in a bank account outside the control of the real estate company.

* If the renter moves out of the apartment, but leaves behind significant damage, the real estate company is entitled to use the security deposit to cover the cost of repairs.

* If the apartment is in good condition at the time of a renter's exit, the security deposit is returned in full to the renter.

A staking protocol can adopt a similar approach to protecting node operators by taking out a "node operator insurance fund" policy via [Nexus Mutual](https://nexusmutual.io/),[Tidal Finance](https://tidal.finance/), or any other crypto-native insurance platform. If an operator's validator is exited legitimately, the insurance fund is returned to the DAO; if the reverse is true (e.g., a validator's exit is triggered by a malicious proposal or withdrawal contract bug), the insurance policy pays out damages to the node operator. Note that this approach can be generalized to any existing relationships that rely on the current specifications for exiting a validator.

EIP-7002's validator exit precompile provides a single functionality: sending an exit message from Ethereum's execution layer to the consensus layer to withdraw a validator. However, some have suggested implementing a general messaging framework (e.g., a `SendMessageToConsensusLayer`precompile, or the Generalized Message Bus (GMB) system-level contract mentioned previously) for passing generic types of messages between the execution layer and consensus layer. This could have benefits like unlocking new ways to activate validators on the Beacon Chain, especially if attaching ETH to EL-to-CL messages is allowed.

However, as Danny Ryan (one of EIP-7002's authors) [explains in a comment](https://ethereum-magicians.org/t/eip-7002-execution-layer-triggerable-exits/14195/3?u=eawosika), spending valuable engineering time on a generic messaging EL → CL framework is a "large undertaking with unclear value proposition". To illustrate, the authors of the GMB (General Message Bus) proposal only identified one other use case for a message bus between the EL and CL: rotating withdrawal credentials for a validator from `0x0`to `0x01`credentials.

This means we're more likely to see the validator exit precompile ship first before core devs talk about implementing a general EL-to-CL message bus, if that will ever happen. Not that keeping things simple ever hurts.

> _Simplicity is a prerequisite for reliability. — Edsger W. Dijkstra_

I've elaborated on the benefits of enabling withdrawal credentials to trigger an exit for the most part, but there are _some_edge-cases associated with that feature. The idea goes like this (h/t to [this comment on GitHub](https://github.com/ethereum/EIPs/pull/7002#issuecomment-1549270730)):

* If a validator's signing key is compromised, a hacker can demand ransom, or try to reduce the validator's balance—but it cannot withdraw funds under any scenario. A waiting game will ensue: Will the attacker destroy the entire balance, or will the staker be able to withdraw some part of the stake once the validator is forcefully exited?

* However, once EIP-7002 is implemented, the hacker in the previous scenario can proceed to exit the validator and withdraw the balance (once EIP-7002 is implemented) instead of settling for a griefing/blackmail attack.

In short, solo stakers and staking services will need more protection for withdrawal credentials post-EIP 7002. This is why adoption of social recovery, multifactor (MFA) authentication, and key rotation are considered critical to improving security for solo/delegated staking operations.

EIP-7002 breaks with tradition by specifying the validator exit precompile as a stateful precompile. A quick ELI5 intro to precompiles for the uninitiated:

* Precompiles are system-level programs hardcoded into the Ethereum Virtual Machine (EVM) to provide functionality that would be expensive or inefficient to implement using a regular smart contract.

* Calling a regular smart contract loads the bytecode stored at the address into the EVM, but the EVM will directly execute a function on the provided inputs and return the output in the case of a precompile, as the code for a precompile is stored directly in the EVM
* Ethereum currently [has nine precompiled contracts](https://www.evm.codes/precompiled?fork=shanghai)that implement functionality ranging from cryptographic functions for hashing data (e.g., SHA-256) to verification of ECDSA (Elliptic Curve Discrete Algorithm) signatures on Ethereum transactions.

Precompiles are typically stateless and lack the storage semantics found in regular smart contracts. (i.e., no storage is associated with the address). A stateful precompile (i.e., one that maintains storage variables and exposes `view`functions) is rare; to date, the only other example of a stateful precompile is the `BEACON_ROOT`precompile proposed in [EIP-4788](https://eips.ethereum.org/EIPS/eip-4788), which stores Beacon block roots in the EVM and exposes information about Ethereum consensus to the execution layer.

Per EIP-7002's authors, using a stateful precompile [keeps the design of the validator exit precompile simple and future-proof](https://eips.ethereum.org/EIPS/eip-7002#stateful-precompile). Still, using a (stateful) precompile to implement validator exits bumps up against what some might consider a better and potentially simpler approach: using a special-purpose, system-level smart contract to manage validator exits. The reasoning goes like this:

* Precompiles are usually reserved for computationally heavy operations, but the calculations and accounting logic implemented by the validator exit precompile proposed by EIP-7002 _can_be implemented with a regular smart contract.

* Since every execution client is required to add special code for handling each precompile, implementing EIP-7002 may increase overhead for client teams—in comparison to the alternative (a system-level contract for managing EL exits) that only requires clients to read logs once a validator exit message is received.

This argument looks compelling on the surface, but there's a catch ([h/t to Danny Ryan for the idea](https://ethereum-magicians.org/t/eip-7002-execution-layer-triggerable-exits/14195/3?u=eawosika)): using a system-level smart contract, similar to the Beacon Chain's deposit contract, to manage validator exits would make it difficult, or even impossible, to modify one or more components of the validator exit mechanism in the future. Smart contracts are supposed to be immutable, so an upgrade may require the same type of "irregular state transition" required to exit funds from the DAO contract—and likely trigger the Ethereum community's version of WWIII.

A (stateful) precompile, like EIP-7002's validator exit precompile, can't exactly be upgraded at a whim, but at least client developers could collectively agree on modifications to the precompile's logic and implement them during a hard fork—like any regular upgrade—which wouldn't require extensive consensus. (**Sidenote**: The same comment suggests ideas for modifying the deposit contract's logic have generally met strong resistance in the past.)

The validator exit precompile `trigger_exit()`functionality doesn't carry out any additional checks, besides checking the attached exit fee, potentially allowing an attacker to clog the message queue with invalid exit requests (e.g., exit messages for a non-existent validator or an inactive validator will be invalidated during the consensus layer's validity checks). EIP-7002 uses a dynamically priced exit fee to rate limit exit requests and make such attacks costly, similar to how EIP-1559 discourages spamming attacks and block stuffing by adjusting gas prices based on network activity.

An alternative design is to restrict calls to validator exit precompile to actual validators—for example, by checking that `validator_pubkey`corresponds to the public key of an active Beacon Chain validator. This could simplify EIP-7002's design by removing the need for a complex, EIP-1559-style pricing mechanism and, potentially, reduce the exit fee since spamming the queue with fake exits may be less of an issue.

However, this requires that the execution layer be able to trustlessly access information about the consensus layer—to check `validator_pubkey`against the Beacon Chain's validator registry—a feature that depends on implementing EIP-4788. This adds more complexity to EIP-7002 and introduces a new dependency between the two EIPs, which can have implications for future design improvements as [noted in this section of EIP-7002's rationale](https://eips.ethereum.org/EIPS/eip-7002#rate-limiting-using-exit-fee).

Even if EIP-4788 was integrated with EIP-7002, we'd still need additional mechanisms to prevent other forms of spamming that involve _legitimate_validators; an example is submitting multiple exits for the same validator in a very short period. This in turn necessitates adding (and enforcing) a new rule like "you can only submit one exit per validator every 3-4 months", which may require even more changes to the validator exit precompile.

In contrast, the current rate limiting mechanism is simple to reason about and guarantees enough protection against most security issues associated with execution-layer exits. For example, the exit fee can automatically adjust upwards to deter griefing (attempting to prevent honest validators from exiting) and spamming and DOS attacks (trying to overload the Beacon Chain by forcing consensus nodes to waste resources on filtering invalid exit operations).

Delegated staking has received significant criticism in recent months, but it's safe to assume the staking-as-a-service industry is here to stay. If so, reducing the risk for individuals delegating stake—whether to a liquid staking pool or an institutional non-custodial staking service—is important. EIP-7002 achieves this goal by making `0x01` withdrawal credentials capable of exiting validators and withdrawing stake and reducing the need for stakers to trust a node operator's honesty.

EIP-7002 also has other positive spillover effects. In particular, improving the resilience and security of solo staking operations and distributed validators—by enabling better recovery from loss of a validator key or DVT keyshares—should reduce the barrier to solo staking and reduce stake centralization on Ethereum.

As usual, I'll close by asking you to consider sharing this article with someone who may find it informative and, more importantly, subscribe to Ethereum 2077 for more deep dives on all things Ethereum R&D. You can also [connect with me on Twitter](https://twitter.com/eawosikaa)to share comments or feedback on this article.
