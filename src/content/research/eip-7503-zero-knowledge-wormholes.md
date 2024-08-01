---
title: "EIPs for Nerds #5: EIP-7503 (Zero-Knowledge Wormholes)"
pubDate: March 25, 2024
author: Emmanuel Awosika
authorTwitterHandle: eawosikaa
tags:
  - Governance
  - Layer1
imgUrl: '../../assets/EIPsForNerds5-EIP-7503(Zero-KnowledgeWormholes).webp'
description: 'Making privacy-preserving transfers on Ethereum'
layout: '../../layouts/BlogPost.astro'
---
![image](../../assets/EIPsForNerds5-EIP-7503(Zero-KnowledgeWormholes).webp)

## Introduction
[EIP-7503: Zero-Knowledge Wormholes](https://eips.ethereum.org/EIPS/eip-7503) is an Ethereum Improvement Proposal (EIP) that introduces a mechanism for making privacy-preserving transfers on Ethereum. While we've seen many efforts to make on-chain transfers private, including cryptocurrency mixers like Tornado Cash, EIP-7503 is a protocol-layer solution that makes Ethereum _private by default_.

This is an important consideration: application-layer approaches to privacy like Tornado Cash are "opt-in", which often has negative implications for users. Privacy-focused applications are also more susceptible to censorship; for example, many users (especially US citizens) have been unable to interact with Tornado Cash after the Office of Foreign Assets Control (OFAC) [blacklisted the protocol's contract addresses in 2022](https://www.coindesk.com/policy/2022/08/08/crypto-mixing-service-tornado-cash-blacklisted-by-us-treasury/).

Despite OFAC sanctions, Tornado Cash is still running for several reasons:

The aforementioned factors mean people are still able to use Tornado Cash today, even if analytics suggest block producers on Ethereum are [dropping transactions that interact with the protocol's contracts](https://thedefiant.io/flashbots-tornado-sanctions-mev). However, just like in the pre-OFAC sanction days, not every transaction routed through the Tornado Cash mixer protocol has been legitimate. To illustrate, an [article by Arkham Intelligence](https://www.arkhamintelligence.com/research/understanding-tornado-cash) suggests at least two high-profile attacks in 2023 (Euler Finance's $197 million exploit and Anubis DAO's $60 million rug-pull) were either funded by funds withdrawn from Tornado Cash, or used the mixer to launder stolen funds and conceal outgoing transfers.

Given that Tornado Cash hasn't solved the problem of bad actors abusing on-chain privacy, why would we want to implement a feature for conducting private transfers at the protocol level? Isn't that _risky_? Why is it even necessary to have private transactions in the first place? Aren't blockchains like Ethereum already anonymous and "untraceable"?

These are all legitimate questions, all of which we'll discuss in this article. We'll provide a high-level overview of the importance of financial privacy and explore why public blockchains like Ethereum cannot guarantee privacy without making changes. Then we'll analyze EIP-7503's approach to enabling private payments on Ethereum and discuss the potential advantages and drawbacks of adopting EIP-7503.

Let's dive in!

## Setting the stage: Why should we care about on-chain privacy?
When we talk about "private transactions" or "anonymous transactions" in the context of electronic peer-to-peer (P2P) payments, we're describing two qualities: **untraceability** and **unlinkability**. Both qualities are set out by Nicolas van Saberhagen in the [CryptoNote whitepaper](https://bytecoin.org/old/whitepaper.pdf):

* **Untraceable**: A transaction is untraceable if the sender cannot be reliably identified by an external observer. Suppose Alice is friends with Bob and Carol and Alice receives two tokens via a transfer—untraceability means no one can tell who (Bob or Carol) sent tokens to Alice.

* **Unlinkable**: A transaction is unlinkable if the recipient cannot be reliably identified by an external observer. If Bob and Carol send tokens to Alice in separate transactions, unlinkability means no one can tell if Bob and Carol sent tokens to the same person.

Most (if not all) on-chain privacy solutions can be categorized based on which of the aforementioned requirements they satisfy. [Cryptocurrency mixers](https://en.wikipedia.org/wiki/Cryptocurrency_tumbler), [CoinJoin](https://www.investopedia.com/terms/c/coinjoin.asp), and [ring signatures](https://medium.com/asecuritysite-when-bob-met-alice/ring-signatures-and-anonymisation-c9640f08a193) are primarily concerned with concealing information about sending addresses and making funds untraceable. The identity of the sender is shielded using different mechanisms, but anyone can see who received the funds.

In comparison, privacy-centric protocols like [Monero](https://www.getmonero.org/resources/moneropedia/ringCT.html), [Zcash](https://z.cash/learn/what-is-the-difference-between-shielded-and-transparent-zcash/), [Liquid Network](https://research.liquid.net/guide-to-confidential-transactions/), and [Aztec v1](https://aztec-protocol.gitbook.io/aztec-documentation/guides/an-introduction-to-aztec/confidential-transactions-have-arrived) offer variants of "shielded" or "confidential" transactions and guarantee unlinkability of transactions. A shielded or confidential transaction is difficult to link to a specific recipient because details of the recipient's address (as well as the amount and type of token transferred) are kept secret. [Stealth addresses](https://vitalik.eth.limo/general/2023/01/20/stealth.html) are another approach to preserving unlinkability: users generate an ephemeral (short-lived) address to a deposit, blocking attempts to link two transfers to the same address.

The aforementioned approaches to improving transaction privacy have unique strengths and weaknesses, which we'll explore briefly later. But, for now, we'll turn our attention to a fundamental question: "Why does financial privacy matter at all?" Since we're dedicating time and effort to analyzing a proposal to bring private and anonymous transactions to Ethereum, we might as well lay out the rationale for enabling transaction privacy on Ethereum.

Financial privacy matters because [privacy is a basic human right](https://en.wikipedia.org/wiki/Right_to_privacy). The right to privacy confers on every individual the power to decide what information they wish to share publicly and retain control of how, when, and where personally identifiable information (PII) is shared. "Personally identifiable information" is a broad category that includes any information that can be used to uncover an individual's identity—including details of financial activities (e.g., purchase history, electronic transfers, and earnings).

Below are some examples of how individuals may exercise their rights to (financial) privacy:

* **Buying birth control online without your family asking why you don't want to increase the headcount at next year's Thanksgiving.** Imagine banks released information about online transactions so that Grandma Beth knew Cheryl was actively depriving her of grandchildren. How awkward would things get?

* **Donating to a charity without disclosing details of how much you donated or whether you donated at all.** This is important if you're donating to a charitable cause that may still raise eyebrows in certain circles—or you hate to put on a performance and draw (unnecessary) attention to your philanthropic activities.

* **Donating to a political cause you don't want to be publicly associated with.**Take, for example, Vitalik Buterin (originally from Russia) donating to Ukrainian forces fighting Russia's invasion—given Vitalik's nationality, a public donation would've probably triggered an unnecessary PR crisis, so [funds were sent through Tornado Cash instead](https://forkast.news/vitalik-buterin-says-used-tornado-cash-donate-ukraine/).

* **Making payments without exposing details of your financial standing to bad actors.** You don't want someone knowing you earned $X in gross income last year, which gives them enough information to create a plan to steal that money (e.g., via scams and other social engineering tactics).

* **Paying employees without exposing information about employee earnings.** Maybe you'd rather keep details of your company's financial activities private, or your employees want to keep that information private.

These examples provide practical use cases for financial privacy, but also highlight a detail critics of privacy rights often fail to acknowledge: privacy isn't something we believe we need until when it's too late. The usual "what are you hiding?" retort fails to acknowledge certain situations where parties involved want to leak little to no information about a financial transaction. And even if people _wanted_ to hide things for arbitrary reasons, why bother them, provided their desire for secrecy doesn't endanger public health and safety?

> It is better to have, and not need, than to need, and not have. ― Franz Kafka

## Solving Ethereum’s privacy problem with EIP-7503
Contrary to early descriptions by proponents and critics alike, public blockchains like Ethereum and Bitcoin are far from anonymous or private. These two terms are often conflated, but they mean two different things:

* Privacy means your **secret** actions are traceable to your public identity, but details of your actions are hidden. Suppose you send an encrypted email using a PGP ([Pretty Good Privacy](https://www.techtarget.com/searchsecurity/definition/Pretty-Good-Privacy)) tool: the mail servers know you sent an email to another (identifiable) party, but cannot read the email's contents. This is a secret action because no one else knows you sent an email, except the recipient.

* Anonymity means your **public** actions are decoupled from your public identity. To use the previous example: an hypothetical, peer-to-peer anonymous email service could obfuscate the origin and destination of an encrypted email, while maintaining a public record of all emails routed through the network. This is a public action since the record of someone sending an email is visible to every participant on the network, but email addresses are hash strings (`0xdeadbeef`) and not names ([alice@gmail.com](mailto:alice@gmail.com)).

Ethereum isn't private because the blockchain maintains a record for each transaction, including how much was transferred and what on-chain actions the transaction executed. Ethereum isn't anonymous, either, because information about accounts transacting on the blockchain (identified by **addresses**) is public. You may not use a real name like "Alice Hopkins" for your Ethereum account, but using the same address for every transaction allows blockchain forensics to correlate transactions to your real-world identity—using techniques like [IP address monitoring](https://beincrypto.com/eth-staking-privacy-concerns-ip-addresses/), [address clustering](https://coinpaper.com/2662/how-to-trace-ethereum-address-owner-a-clear-guide), and [graph analysis](https://arxiv.org/pdf/2203.09360.pdf).

![bored apye yatch buz feed](./images/eip-7503-bored-ape-buzzfeed.webp)
<span class="text-base italic text-center">Founders of the Bored Ape Yacht Club (BAYC) NFT project were doxxed by BuzzFeed in 2022. Read the <a href="https://www.buzzfeednews.com/article/katienotopoulos/bored-ape-nft-founder-identity" target="_blank">full story</a> and rebuttals from <a href="https://github.com/jpantunes/awesome-cryptoeconomics/blob/master/NFTnow.com" target="_blank">NFTnow.com</a> and <a href="https://decrypt.co/92223/bayc-bored-ape-founders-buzzfeed" target="_blank">Decrypt</a>..
<span>

Ethereum is thus accurately described as _pseudonymous_ and cannot guarantee anonymity or privacy. Which is bad for a platform expected to become the settlement layer for the future Internet of Value. For context, banks already provide some level of privacy to users by storing financial data in centralized databases with strict access control mechanisms in place to prevent unauthorized access.

This is "pseudo-privacy" since the bank and the database infrastructure provider have access to this information and can do whatever they want with it (e.g., freeze payments to certain countries to comply with sanctions based on analysis of a transfer's destination). But in a classic case of "choose between the devil and the deep blue sea," the average individual is likely to pick _some_ privacy over no privacy, which rules out opening an Ethereum account and having every on-chain action visible to the world.

Many have recognized this problem, especially because it drives users away from decentralized technologies like Ethereum to centralized solutions that offer slightly better privacy guarantees at the expense of resistance to censorship and transparency (among others). For example, Vitalik's _[The Three Transitions](https://vitalik.eth.limo/general/2023/06/09/three_transitions.html)_ provides a great argument for the importance of privacy to Ethereum's prospects of mass adoption:

> Without the third [a transition to privacy-preserving transfers], Ethereum fails because having all transactions (and POAPs, etc) available publicly for literally anyone to see is far too high a privacy sacrifice for many users, and everyone moves onto centralized solutions that at least somewhat hide your data. — Vitalik Buterin

[EIP-7503](https://eips.ethereum.org/EIPS/eip-7503)is an effort to remedy some of the problems described previously, particularly the lack of anonymity for transaction senders. The proposal introduces a means for addresses to deliberately destroy Ether (ETH) by sending funds to an _unspendable address_, and generate a ZK-SNARK proof to authenticate a deposit to the unspendable address. If this proof passes verification, an amount of ETH tokens (equal to the balance of the unspendable address) is minted to a new address of the user's choosing—breaking the link between the sending and receiving addresses involved in the transfer of funds.

EIP-7503 borrows ideas from existing privacy protocols to power privacy-preserving transactions on Ethereum. For example, the proposal makes it difficult to trace funds received in a minting transaction to a particular source by turning the entire set of Ethereum addresses with an ETH balance and zero outgoing transactions into an _anonymity set_. You cannot easily identify the address _**A**_ responsible for burning the ETH that address _**B**_ re-minted in the next transaction: _**A**_ could be one of the millions of addresses that have a non-zero balance but haven't initiated an Ethereum transaction.

This is similar to the idea of mixing funds together from different sources into a single pool and allowing depositors to withdraw funds from the pool using a different address. However, EIP-7503 compares favorably to cryptocurrency mixers like Tornado Cash because it provides _plausible deniability_. Plausible deniability is a concept we'll explore later, but all you need to know for now is that it allows you (a user conducting an EIP-7503 private transfer) can deny ever conducting a private transaction.

Plausible deniability is an important feature of EIP-7503 that prevents external observers from de-anonymizing senders of private transactions. This can prevent a repeat of the Tornado Cash fiasco in which certain addresses were blacklisted and restricted from accessing dapps, exchanges, and DeFi protocols because on-chain forensics revealed historical interactions with Tornado Cash—even if some of those accounts had interacted with Tornado Cash for benign reasons (e.g., making private donations).

EIP-7503 also borrows from other privacy-centric protocols like Zcash and Aztec v1 by using cryptographic proofs to validate transactions without exposing transaction details. Validating transactions in a privacy-preserving manner ensures Ethereum can _safely_ support private transfers without undermining the existing security model that depends on the distributed network of nodes re-executing each transaction to confirm its correctness. We'll explore details of how EIP-7503 uses ZK-SNARKs under the hood to support secure execution of private transfers on Ethereum in subsequent sections (among other things).

_**Caveat**: Despite distinguishing privacy from anonymity, I'll be using "private" and "anonymous" interchangeably throughout this article to keep things simple and avoid confusion for readers used to thinking of the two concepts as one and the same. Moreover, EIP-7503 includes elements of anonymity (breaking links between senders and recipients) and privacy (a proposed extension to the current proposal will allow users to conceal deposit and withdrawal amounts)._

## An overview of EIP-7503: Zero-Knowledge Wormholes
![](./images/eip-7503-workflow-of-private-transfer.webp)
<span class="text-base italic text-center">Workflow of private transfers defined by EIP-7503.<a href="https://github.com/okwme/eip-7503-chain" target="_blank"> (source)</a>
<span>

At a high level, EIP-7503 works as follows:
### 1. Users “burn” ETH by sending it to an address whose balance is unspendable.
An address is unspendable if no one has access to the private key required to sign a (valid) transaction that spends from the balance. This is similar to sending funds to the [zero address](https://etherscan.io/address/0x0000000000000000000000000000000000000000): the account has no private key, making any asset it receives irrevocable or "burned".

The zero address is the wealthiest account in Ethereum with more than $280 million in token holdings. Except for a few unfortunate users that send funds to the zero address by accident, the vast majority of users that send tokens sent to the zero address are either [creating a contract](https://ethereum.stackexchange.com/questions/13523/what-is-the-zero-account-as-described-by-the-solidity-docs) (which requires setting the zero address as the recipient) or purposefully taking those tokens out of circulation.

The original [ERC-20 token standard](https://eips.ethereum.org/EIPS/eip-20) doesn't specify functions for reducing a token's supply, which means older tokens like WETH (wrapped Ether) have no way of ensuring that users take wrapped assets out of circulation before withdrawing the original deposit. Sending WETH tokens to the zero address, however, makes them unspendable and simulates a reduction in the circulating supply of WETH each time ETH is withdrawn from the WETH wrapper contract. If you wonder how WETH maintains a 1:1 ratio with native ETH, there's your answer.

EIP-7503 makes use of a similar mechanism to allow users to burn ETH and mint tokens to a different address on Ethereum with a small twist. Instead of asking users to send funds to a single burn address, EIP-7503 requires users to generate a unique burn address for every transaction before minting ETH to another address.

### 2. Users create a private proof-of-burn or “burn receipt” that proves they burned some amount of ETH in a previous transaction by sending it to a burn address.
Sending funds to a burn address (created according to the EIP-7503 specification) is the equivalent of chucking cash into a wormhole—it can never be recovered. But you _can_prove knowledge of something that was sent to the wormhole using a ZK-SNARK (**Z**ero- **K**nowledge **S**uccinct **A**rgument of **K**nowledge); hence the term "zero-knowledge wormholes".

The proof-of-burn is private because a user only has to prove that it sent tokens to an unspendable address _**A**_ without revealing _**A**_ in plaintext. Generating a proof-of-burn requires proving that the burn address is really unspendable. Why? Asking users to burn native ETH before minting new ETH tokens to the recipient address ensures parity (in value and fungibility) of both types of assets, if users can later withdraw funds from the burn address, the 1:1 peg between native ETH and minted ETH tokens would cease to exist.

### 3. Users mint ETH tokens by submitting a private proof-of-burn to a full node that credits a user an amount equivalent to the deposit transferred to the burn address.
EIP-7503 introduces a new transaction type in the EVM (Ethereum Virtual Machine) that accepts a proof-of-burn and a recipient as inputs and mints new ETH tokens to the sending address if the proof is verified successfully. To prevent minting ETH twice for the same burn transaction, a special "nullifier" value is attached to every proof-of-burn to track the address's usage.

If the ETH sent to an unspendable address is successfully re-minted, the nullifier prevents a dishonest user from generating a new valid proof-of-burn for funds sent previously to the address (i.e., double-minting attacks). Importantly, the nullifier identifies a used address without leaking information about the address in plaintext.

With that high-level introduction, we can now dive into the low-level details of EIP-7503's implementation. The next sections will discuss key details of implementing EIP-7503 such as:

* Generation of the unspendable address
* Generation of private proofs-of-burn
* Verification of private proofs-of-burn
* Minting of ETH for recipients of private transfers

### Generating the unspendable address
A regular Ethereum address is the first 20 bytes of the Keccak256 hash of the **public key** generated from the account's **private key** (the private key is an integer generated from a mnemonic or seed phrase). Both private keys and public keys are generated using the **Elliptic Curve Digital Signature Algorithm** (ECDSA). ECDSA is a complex topic ("complex" is my preferred euphemism for "has lot of math"), but here are a few resources—ranked from beginner to expert on the topic:

The public key is derived by multiplying the private key (called a secret or _s_for short) by a special "generator" value _**G**_ to produce a new value of the form `pubKey = privKey * G`. **T**he address is generated by running the public key through the Keccak256 hash function and taking the first 20 bytes of the hash string. In pseudo-mathematical notation, the operation looks like: `A = K(s * G)`, where _**A**_ is the address, _**s**_ is the secret or private key, and _**G**_ is the generator point on the elliptic curve.

The address, public key, and private key serve very different purposes:

* The address is shared publicly and identifies the account receiving funds transferred in a transaction.

* The private key is used to sign a message that instructs the network to transfer tokens out of the balance of an address and must be kept secret.

* The public key allows for verifying that a transaction's signature was generated by the corresponding private key.

The last item in the list points at a subtle detail: it is only possible to spend funds sent to an address if you control the private key—that is, you know the private key that was used to generate the public key, from which the address was derived. If you don't know the private key for an address, or the private key is controlled by someone else, you cannot spend funds from that address.

How do we know if the balance of an address `A` is unspendable? We can start by randomly choosing a random 20-byte value for `A` and taking advantage of a special property of cryptographic hash** functions known as **preimage resistance**. In simple terms, preimage resistance means that we cannot find a value `x` so that `H(x)` (the hash of `x`) is the same as `A` if `A` was chosen randomly. In pseudo-mathematical notation, this claim is of the form: `H(x) &#x2260; A`.

`A` is the _image_ of the hash (the output of the hash function) and `x` is the preimage of the hash function (the input to the hash function). Finding the value of `x` for `H(x) = A` is difficult due to (a) the sheer number of possible integers (b) the way in which inputs are manipulated by a hash function to produce an output. Thus the only way you can "guess" a value for `x` that results in `A` is if you have an enormous amount of computing power and enough time on your hands to run through a enormous number of calculations to find `H(x) = A`.

While this isn't your Cryptography 101 class, the previous explanation captures a key property of modern-day cryptography systems. The preimage resistance property of hash functions also plays a key role in EIP-7503: if `A` is a random 20-byte value, we have reasonable confidence that a user cannot derive the private key _**s**_ has no way to spend funds from the address. That is, it is impossible to calculate `A = H(h(s * G)`, where _**A**_ is the burn address, _**s**_ is the private key or secret, and _**G**_ is the generator point (small note: `k(s * G)` is equivalent to `x` from the previous paragraph).

But, this strategy isn't completely foolproof. For example, how can we determine that `A` is really random and isn't the result of computing `s * G`? If a user is choosing `A` independently, we need to either trust the user or build complex procedures for verifying that `A` was chosen randomly; if we're choosing `A`, we don't need to trust a user—but there's a non-negligible probability that someone might luck out and correctly guess `x`. Since `x = s * G`, this knowledge may allow the user to derive the private key `s` and spend from the supposedly unspendable address.

This is obviously suboptimal and highlights the need for a more secure mechanism for generating unspendable addresses. Fortunately, cryptographic hash functions have another property that we can exploit: **collision-resistance**. In simple terms, collision-resistance means you cannot find `H(x) = H(y)`, where `x` and `y` are different inputs—that is, the calculation of hashes for different input values cannot "collide" and produce the same result.

Collision-resistance is important for preventing forgery (among other things): two people hashing two different inputs will always have different hash strings and one cannot claim to possess the input known only to the other person. Another version of collision-resistance is that you can't find `H1(x) = H2(x)`, where `H1` and `H2` are from different families of hash functions. In other words, the calculation of the hash of `x` using different hashing algorithms cannot "collide" and arrive at the same output.

To understand why this is possible, we'll make up a contrived example to explain how hash functions work:

Alice, Bob, Cheryl, and Max belong to rival political parties: Alice and Bob are members of the Blue Party, while Cheryl and Max belong to the Red Party. Blue Party stalwarts and Red Party stalwarts want to share information among themselves without leaking sensitive details to the rival party members and independently come up with different codes for encrypting messages.

Blue Party's code is known as the Double Letter algorithm, while Red Party uses a variant called the Triple Letter Algorithm. The code is very simple: we replace alphabets with numbers when writing messages—each number in the message string refers to a letter at a particular position of the alphabet. The "encryption" bit comes from the way we choose numbers to represent alphabets:

* In the Blue Party "Double Letter" code, we divide each number by two and use the resulting number (n) to find the letter in the nth position of the alphabet. For example, we can encrypt "B-O-Y" as `4-30-50`: 4/2 = 2 ("B" is the 2nd letter of the alphabet); 30/2 = 15 ("O" is the 15th letter of the alphabet); 50/2 is 25 ("Y" is the 25th letter of the alphabet).

* In the Red Party "Triple Letter" code, we divide each number by three and use the resulting number (n) to find the letter in the nth position of the alphabet. For example, we can encrypt "BOY" as `6-45-=75`: 6/3 = 2 ("B" is the 2nd letter of the alphabet); 45/3 = 15 ("O" is the 15th letter of the alphabet); 75/3 = 25 ("Y" is the 25th letter of the alphabet).

This example uses encryption for the same message, but we can expect that Blue Party and Red Party folks will be exchanging different messages in practice (e.g., "Max is a jerk" (Alice → Bob) and "Blue Party members are losers" (Cheryl → Max), etc.). Nevertheless, encrypting the same message with different codes is useful for explaining collision-resistance in cryptographic hash functions:

When "BOY" is encrypted using Blue Party's "Double Letter" algorithm and Red Party's "Triple Letter" algorithm, the results are very different (`4-30-50` and `6-45-75`, respectively). A Blue Party member cannot generate `6-45-75`, except it uses the Red Party encryption algorithm; nor can a Red Party member produce `4-30-50` as a message string, except it uses the Blue Party encryption algorithm. Since each party guards details of the encryption algorithm, we know that a rival party member cannot decrypt a message that wasn't meant for them.

Cryptographic hash functions are different from encryption algorithms: hash functions are _one-way_ and have no way of deriving inputs from the output, whereas encryption algorithms like the ones from the example have a _key_ for decrypting the inputs to the encryption function. But hash functions and encryption algorithms have similarities, especially in the area of collision-resistance. Just like we couldn't find the same output (an encrypted message) for a single input using different encryption algorithms, we cannot find the same output (a hash) for a single input using different hash functions.

We can exploit the collision resistance of hash functions to generate _provably_ unspendable addresses for burning assets as required by EIP-7503. First, we ask users to choose a secret value _s_ (the private key for an Ethereum account), compute the Keccak256 hash of `s * G`to derive the public key, and hash the public key to derive an address _**A**_. Then we ask the user to generate a new address _**B**_ by hashing the secret value _**s**_ with a different hash function denoted as _**H**_ and taking the first 20 bytes of the output as the address.

Our goal? We want to end up with `K(x) &#x2260; H(x)`, where _**K**_ represents the Keccak256 hash function and _**H**_ represents a hash function from a different family of hash functions. For performance reasons, we want _**H**_ to be "ZK-friendly" (i.e., verifying the result of `H(x)` inside a circuit should be cheap and fast).

We cannot know the public key for _**B**_ because the address was generated randomly instead of computing the Keccak256 hash of `s * G` (private key multiplied by generator), which means the private key for _**B**_ is also unknowable. If we don't know the private key for _**B**_, we cannot produce valid signatures for a message that spends the balance of _**B**_. With a provably random process for generating unspendable addresses, we now have a way for users to burn ETH before re-minting assets.

### Generating the private proof-of-burn
How do we prove that a particular user sent ETH to an unspendable address _and_ the unspendable address was created by that user? The first check is necessary to avoid fraudulent minting of ETH (we don't mint new ETH tokens unless we have proof a user has burned ETH previously), but the second check is also important: we need to know an address was created by the user—otherwise, we would require a piece of information (e.g., the hash of the burn transaction) to confirm a user isn't trying to claim another person's deposit.

Since we want to avoid leaking information about a user's participation in the privacy protocol, we allow users to instead create a zero-knowledge proof proving knowledge of _**s**_ (the secret value hashed to derive the burn address) without releasing _**s**_ publicly. The zero-knowledge proof asserts the user's knowledge of an address _**B**_ that is derived from the result of `H(s)`: since _**s**_ was chosen secretly, another person cannot compute a different value `H(x)` such that `H(s) = H(s)`. This is due to the collision resistance property of hash functions described earlier.

Hiding _**s**_ prevents malicious actors from redeeming a user's deposit by submitting a proof that confirms knowledge of the secret _**s**_ (used to generate an unspendable address) to the EIP-7503 verifier. This section glosses over why we're able to create a zero-knowledge proof that proves `H(s) = A` without requiring the verifier to calculate `H(s)` independently. But you can read Vitalik's [Quadratic Arithmetic Programs: Zero To Hero](https://medium.com/@VitalikButerin/quadratic-arithmetic-programs-from-zero-to-hero-f6d558cea649) and [my article on ZK-EVMs](https://linea.mirror.xyz/qD18IaQ4BROn_Y40EBMTUTdJHYghUtdECscSWyMvm8M) for some background on using ZK-SNARKs to prove the validity of a computation without revealing the inputs.

We describe the zero-knowledge proof validating a user's transfer of funds to an unspendable address (a.k.a., a _burn address_) as a "proof-of-burn" or "burn receipt". The proof-of-burn is proving the following statements:

* The user knows an address _**A**_ and the secret value _s_that was hashed to derive A (i.e., `H(s) = A`). This is checking that the address is unspendable by confirming _**A**_ is the result of hashing _**s**_ with a (ZK-friendly) hash function different from the Keccak256 hash function used to generate spendable Ethereum addresses.

* The address _**A**_ has a positive ETH balance equal or greater than _**b**_ (`b &#x2265; b&#x2019;`). This is checking that the amount a user is trying to mint to the receiving address is the same as the amount deposited in the unspendable address.

While proving #1 is relatively straightforward, proving #2 requires asserting certain things about Ethereum's state. In particular, we must prove that (a) the unspendable address exists in the canonical Ethereum [state trie](https://medium.com/@eiki1212/ethereum-state-trie-architecture-explained-a30237009d4e) and (b) the claimed balance of the unspendable address matches the balance associated with the address in the state trie. This requires passing a **[Merkle proof](https://ethereum2077.substack.com/i/139794043/a-gentle-introduction-to-vector-commitments-and-witnesses-in-merkle-trees)** for the address _**A**_ as an input to the circuit that generates the proof of burn.

The Merkle proof consists of the leaves of the Merkle Patricia Trie (MPT) required to compute the path from the leaf we're attempting to prove (the address _**A**_) to the root of the Merkle trie (the trie root is also part of the Merkle proof). We need evidence that the state root—which is used to verify the Merkle proof—is also canonical, so we require the user to pass a block header _**B**_ as an additional input to the circuit. This set of information allows a resource-constrained verifier to efficiently verify that the inclusion of address _**A**_ in the state trie and validate the balance _**b**_ of **A**.

_**Note**: The EIP-7503 specification recommends deriving the Merkle proof required to prove inclusion of the burn address in the state trie and validate the address's balance via the [eth_getProof](https://docs.alchemy.com/reference/eth-getproof) JSON-RPC method introduced in [EIP-1186](https://eips.ethereum.org/EIPS/eip-1186)._

### Generating nullifiers for addresses
Another input to the ZK-SNARK circuit that generates a proof of deposit to an unspendable address is a **nullifier**. The nullifier is a value that prevents a user from using the same proof-of-burn to mint ETH _twice_. Without a nullifier, nothing stops a savvy user from reusing a proof-of-burn to withdraw ETH multiple times: from the perspective of a node processing EIP-7503 private transfers, these withdrawals are valid because the balance of the unspendable address never reduces (it can only increase).

The nullifier is passed as input to the ZK-SNARK proving circuit so that a proof-of-burn becomes invalid once verified successfully. We achieve this property by extracting the (used) nullifier from a proof and storing it in a [Sparse Merkle Tree](https://medium.com/@kelvinfichter/whats-a-sparse-merkle-tree-acda70aeb837) (SMT). Unlike regular Merkle trees that can efficiently prove inclusion of elements, Sparse Merkle trees are efficient for proving _non-inclusion_ of elements. A discussion of SMTs is out of scope, but the previously linked article provides a great overview for interested readers.

An SMT is useful in this case because the ZK-SNARK verification procedure only has to check that the SMT excludes the nullifier attached to a newly submitted proof. If the nullifier is absent from the Sparse Merkle Tree, we know that the user hasn't used this proof-of-burn previously and is withdrawing a provably _fresh_ deposit. We add the used nullifier to the SMT to keep track of the burn address used to re-mint ETH without publicly exposing the burn address.

What would happen if we simply stored burn addresses in a Merkle tree, and checked that the address from a new proof-of-burn isn't part of the tree when processing a new withdrawal?

Using the plain burn address as a nullifier allows external observers to potentially expose the sender of a burn transaction by cross-checking the address's transaction history against the list of burn addresses stored on-chain. Once the burn address (inevitably) appears as a recipient in one of the transactions initiated by the sender, anyone can prove the person controlling the account burned and re-minted ETH.

Using the hash of the burn (unspendable) address makes it difficult, but not infeasible, to know transferred funds privately. This requires a brute-forcing attack that calculates the hash of every Ethereum address that currently exists until one of the hashes matches a nullifier stored in the SMT. Once the preimage of the nullifier hash is discovered (i.e., the unspendable address), the steps described previously can be enacted to trace the account that sent funds to the unspendable address in question.

We can solve this problem by finding a more secure mechanism for generating nullifiers. The strategy adopted in the current EIP-7503 specification is to use the same (ZK-friendly) hash function to generate a nullifier _**N**_ by hashing the burn address with the secret value _s_. In pseudo-mathematical notation, this looks like: `N = H(A,s)`, where _**A**_ is the unspendable address and _**s**_ is the secret value that generated _**A**_ initially.

The secret value _**s**_ is described as a [salt](https://en.m.wikipedia.org/wiki/Salt_(cryptography)) in this instance. This salt value essentially magnifies the difficulty of extracting information about burn addresses from nullifiers: if _s_ was known, an observer could perform a brute-force attack and run all possible combinations of `hash(burnaddress,secret)` that produce a nullifier `N` stored on-chain. But _**s**_ is kept secret by the user, effectively eliminating the possibility of finding the corresponding burn address for a used nullifier.

### Verifying the private proof-of-burn
Now that we know what statements the proof-of-burn is trying to prove, we have a fair idea of how proof verification works. For the first statement (`h(s) = A`), the verifier needs to "understand" the logic of the hash function used to generate the address _**A**_ —so it knows that `H(s)` indeed equals _**A**_. Encoding the logic of the hash function in the verifier circuit also enforces the requirement that _**A**_ cannot be generated with the Keccak256 hash function.

For the second statement (_**A**_ has a positive balance _**b**_ of ETH), the verifier must verify a Merkle proof that proves the inclusion of _**A**_ in Ethereum's state and validates the account's data. The circuit verifier also checks that the block header _**B**_ is from the canonical chain—before extracting the state root—by calling the `BLOCKHASH` opcode with the input `block.blockHash(blockNumber)`, where `blockNumber` refers to the block header _**B**_. If _**B**_ is part of the canonical Ethereum chain, the `hash`returned by the `BLOCKHASH` opcode should match the hash of the block header _**B**_.

Additionally, the verifier circuit authenticates the nullifier included in the user's ZK-SNARK proof and confirms that the nullifier hasn't been used previously. The collision-resistance of hash functions plays a supporting role here by preventing attempts to generate two different nullifier hashes _**N1**_ and _**N2**_ for the same `burn address <> secret value` combination. If a user can generate different nullifiers for the same address, it can double-mint ETH—regardless of whether the Sparse Merkle Tree stores a nullifier for that address or not.

To ensure proofs-of-burn can be verified by block proposers, EIP-7503 proposes a modification to the EVM to implement support verification of ZK-SNARK proofs. The authors of EIP-7503 have tested the viability of implementing in-EVM verification of burn proofs by creating an EIP7503-enabled version of the EVM using the [Polaris EVM](https://docs.berachain.com/learn/what-is-polaris-evm) framework. You can visit the [GitHub repository](https://github.com/okwme/eip-7503-chain) dedicated to the project for more details of the protocol's design.

### Minting ETH to the recipient address
EIP-7503 introduces a new transaction type that mints ETH for a user that successfully proves it deposited a specified amount to an unspendable address. The sender of the transaction submits a ZK-SNARK proof (alongside a nullifier), and the network performs a state transition that updates the balance of the withdrawal address (after verifying the proof-of-burn).

Although EIP-7503 provides plausible deniability, users are encouraged to avoid paying for minting transactions with funds from the same address that sent ETH to the burn address. If Alice sends ETH to an unspendable address `0xm00la` and later submits a transaction paying for the same amount of ETH to be minted to a separate account, Bob doesn't need to be Jimmy Neutron to link Alice to the original burn transaction.

The previous sections don't mention it, but we need users to include the second address _**B**_ (that will receive ETH from the minting transaction) as a public input to the ZK-SNARK prover circuit. This prevents potential edge-cases from honest users getting frontrun while minting transactions are waiting in the mempool.

Recall that the verifier doesn't check the identity of the sending address and deliberately avoids a requirement to know if the same address that burned ETH is also redeeming ETH in a minting transaction. This is great from a privacy perspective since it means users can re-mint ETH with a freshly generated address—but it increases the risk of frontrunning attack. Since the proof encodes all the necessary information required to pass verification (including knowledge of the secret value _**s**_), anyone can send a copycat minting transaction that has the same proof but a different address for receiving minted ETH.

Fortunately, we can require the proof-of-burn to reference the withdrawal address _**B**_ and enforce a rule of the form: "a minting transaction can only mint ETH to the address extracted from the proof-of-burn". The equivalence between the address passed as a public input to the ZK-SNARK circuit and the address specified in the minting transaction is checked by the verifier. That way, every user is certain that no one can pick up their proof-carrying transaction from the mempool and steal their withdrawal.

## Why EIP-7503? The case for private transfers on Ethereum
### 1. Private transfers and payments
EIP-7503 provides a simple way for Ethereum users to move funds around without (inadvertently) creating a link between sending and receiving addresses. You can send ETH from one wallet to a newly generated unspendable address and withdraw to another wallet by providing the proof-of-burn and nullifier for verification purposes. To an external observer, there's exactly _zero_ correlation between the account burning ETH and the account minting ETH.

An edge-case may appear if a user burns ETH in one transaction and immediately mints ETH to a new address: an expert in on-chain analysis may quickly figure the same person must control both addresses. However, EIP-7503 has a powerful feature for preventing deanonymization: **plausible deniability**. Here's a definition of plausible deniability from [Political Dictionary](https://politicaldictionary.com/):

> Plausible deniability is the ability to deny any involvement in illegal or unethical activities, because there is no clear evidence to prove involvement. The lack of evidence makes the denial credible, or plausible. — Political Dictionary

Plausible deniability originated from the murky world of CIA operations, where officials would deny foreknowledge of actions carried out by subordinates. The lack of a paper trail—a publicly accessible record of events—meant high-ranking officials could disown field operatives and avoid responsibility for outcomes of operatives' actions (avoiding massive PR disasters).

Plausible deniability has a similar meaning in the context of conducting private transfers using EIP-7503. Suppose your "main wallet" burns 1.365 ETH and your "secondary wallet" mints 1.365 ETH shortly after. If your operation attracts the attention of overeager on-chain sleuths, you can just claim that someone else minted 1.365 ETH to make it look like you were completing a private transfer.

_After you get accused of completing a private transfer._

And what if you're asked a question like: "Why would you send ETH to a burn address without the intention to transfer money secretly?" You can claim the transaction occurred by mistake—after all, no one can deny a God-awful amount of ETH has been lost by folks making typos in recipient addresses (even _I_ have made that mistake). This flips the whole conversation on its head because, who else but a cold-hearted individual wouldn't empathize with the loss of a large amount of ETH?

This is a somewhat trivial example that captures the importance of EIP-7503: plausible deniability ensures regular Ethereum users can make private transfers without disclosing any _concrete_ information that could suggest involvement in a privacy protocol. Unlike application-layer privacy protocols, EIP-7503 avoids storing transaction traces on-chain and makes it difficult to associate burn and mint transactions with real-world identities.

EIP-7503 doesn't provide complete anonymity and privacy because the information about the transfer of funds to the burn address—including the amounts transferred—is recorded on-chain. But the ability to break the link between sending and receiving addresses in a transaction is quite powerful and reduces concerns around address reuse.

Instead of using the same address to receive payments, a user can generate a fresh burn address and ask funds be sent to this address. Since the user has knowledge of the secret value _**s**_, it can generate a valid proof-of-burn that demonstrates control over the creation of the burn address to the on-chain verifier and "withdraw" the deposit by minting ETH to a different address. This is quite similar to the concept of generating a stealth address to receive transfers and reduces the odds of correlating different transactions to the same entity.

We can see how EIP7503-style private transfers can be beneficial in other scenarios:

* **Merchants**: By accepting payments in burn addresses and later minting ETH to unlinkable withdrawal addresses, merchants can avoid exposing financial information. EIP-7503's private transaction feature further prevents external observers from gleaming details, like how much a merchant receives for products or the size of the merchant's customer base.

* **Buyers**: By making payments to the burn address provided by a merchant (instead of sending to the merchant's publicly identifiable address), buyers avoid leaking information related to purchase history. The burn address cannot be correlated with the merchant's "real" account, hindering efforts to know what you bought and from whom.

* **Philanthropy**: Charities and political organizations can receive funds without the sender's identity being permanently recorded on-chain. Individuals can donate to certain causes without compromising their public reputations.

EIP-7503 can also be used for _non-privacy_reasons:
1. Currently, centralized exchanges (CEXes) must generate a unique address to receive a deposit from a user and need to send transactions that transfer balances of each address to one or more cold wallets as part of operational security processes. With EIP-7503, a CEX operator can create a single burn address that receives deposits from a set of users and generate a proof-of-burn that withdraws all deposits accumulated in the burn address to the cold wallet in a single transaction. A reduction in the number of transactions required to consolidate CEX deposits in a cold wallet benefits the CEX operator (reduced operational costs) and the network (lower number of on-chain transactions).

2. Any entity that processes a significant amount of payments on-chain can leverage EIP-7503 to improve operational efficiency—so CEXes aren’t the only beneficiaries. Merchants, charity organizations, and crypto-native payment rails are some examples of organizations that use EIP-7503 to reduce operational overhead by aggregating deposits in burn addresses and spreading transaction costs across multiple deposits. This aspect of EIP-7503 has the desired side-effect of creating financial incentives to join the anonymity set and increases the overall privacy for accounts conducting private transfers.

## 2. Balancing privacy with utility and regulatory compliance
EIP-7503 provides a simple path toward enshrining transaction privacy on Ethereum without requiring extensive modifications to the protocol. In particular, EIP-7503 will allow Ethereum to offer transaction privacy without facing problems confronting other privacy-focused blockchains like Zcash and Monero.

Although I have [written in defense of privacy coins previously](https://fullycrypto.com/the-case-for-privacy-coins), it doesn't take a lot to see that privacy coins like ZEC (Zcash) and MNR (Monero) cannot achieve the goal of introducing decentralized, private, and _usable_ money into the global economy. With regulatory pressures forcing exchanges to delist privacy coins, owners will find it increasingly harder to take advantage of the privacy offered by Zcash, Monero, and other protocols explicitly designed to conceal transaction information in real-world contexts. This excerpt from Haseeb Qureshi's _[Why Privacy Coins Haven't Taken Off](https://medium.com/dragonfly-research/why-privacy-coins-havent-taken-off-3a8beae37f14)_ provides a good introduction to the challenges facing "hardcore" privacy projects today:

> Privacy coins have always been the first target for regulatory inquisitions. When regulators are charged to "don't just stand there, do something," the easiest boogeyman is shadowy privacy coins. On the regulatory side, we've seen a slew of privacy coin delistings in [South Korea](https://news.bitcoin.com/south-korean-financial-regulator-confirms-privacy-coin-delistings-adds-new-guidelines-to-report-unusual-transactions/), [Japan](https://news.bitcoin.com/coincheck-delists-xmr-dash-zec-rep/), the [U.K](https://markets.businessinsider.com/news/currencies/monero-kraken-crypto-exchange-delist-privacy-coin-uk-fca-regulation-2021-11). and the [U.S](https://www.coindesk.com/markets/2021/01/01/bittrex-to-delist-privacy-coins-monero-dash-and-zcash/#:~:text=Bittrex%20announced%20Friday%20it%20will,%2C%20at%2023%3A00%20UTC.). Governments are continually trying to tighten the noose on privacy coins (see [here](https://cryptonews.com.au/australian-crypto-exchanges-forced-to-delist-privacy-coins-or-be-debanked), [here](https://www.financemagnates.com/cryptocurrency/news/french-finance-committee-recommends-to-ban-privacy-coins/), and [here](https://bitcoinexchangeguide.com/secret-service-warns-monero-zcash-privacy-crypto-coins-need-legal-actions/)).

Crypto lobbies have grown larger; huge swaths of retail and many institutions now own BTC and ETH. But very few institutions are willing to come to the defense of privacy coins. Rather than allow the entire industry to be tainted, many are content to let privacy coins become the sacrificial lamb. — Haseeb Qureshi ([Why Privacy Coins Haven't Taken Off](https://medium.com/dragonfly-research/why-privacy-coins-havent-taken-off-3a8beae37f14))

EIP-7503 feels like it's come at _just_the right moment in Ethereum's evolution: with more users than any blockchain and a great deal of institutional investment, Ethereum is less likely to suffer the same fate as other projects that have tried to provide private payments functionality in the past. Will a few exchanges restrict trading Ether if privately minted ETH tokens began circulating? Maybe. But a dozen other exchanges would be all too happy to take up that responsibility—this is what having _strong network effects_ looks like.

Why do I say EIP-7503 arrived at the right time? There was a time in Ethereum's history where supporting privacy at the base layer was something everyone felt should be done _immediately_. But others in the community (rightly) pointed out the potential edge-cases associated with promoting Ethereum as a "privacy technology". Here are excerpts from an [old thread on the Ethereum Magicians forum](https://ethereum-magicians.org/t/meta-we-should-value-privacy-more/2475) discussing the need for increased privacy on Ethereum:

![vitalik original forum](./images/eip-7503-vitalik-original-forum1.webp)
<span class="text-base italic text-center">Vitalik’s original forum post calling for solutions to improve privacy for Ethereum users.<a href="https://ethereum-magicians.org/t/meta-we-should-value-privacy-more/2475/19" target="_blank"> (source)</a>
<span>

![vitalik reply](./images/eip-7503-vitalik-original-forum2.webp)
<span class="text-base italic text-center">Virgil Griffith’s reply warning against Ethereum rushing into the privacy game.<a href="https://ethereum-magicians.org/t/meta-we-should-value-privacy-more/2475/22" target="_blank"> (source)</a>
<span>

Griffith's intuitions have been mostly correct in the following years, with many privacy-by-default cryptocurrencies facing the prospect of becoming fringe currencies used only by hardliner cypherpunks (a group that comprises less than 0.00001% of the world's population). In comparison, the value and ubiquity of Ether (ETH) has only increased to the point where "nudging toward privacy technology" by adopting EIP-7503 is less risky than it was five years ago.

If implementing an upgrade to support private transfers—perhaps to avoid [reverse regulatory capture](https://research.independent.org/2022/07/11/rethinking-regulatory-capture/) or minimize base-layer complexity. A suitable alternative is to pass the responsibility for implementing EIP-7503 to Ethereum L2s and L3s. Given Ethereum's rollup-centric roadmap, implementing EIP-7503 on a rollup makes sense and still preserves the goal of enshrining privacy in Ethereum (e.g., similar to rollups implementing ERC-4337 for native account abstraction).

This approach to Implementing EIP-7503 is easier because each L2 chain already has a bridge contract that mints ETH for users on L2. With a mechanism for minting ETH tokens in place, rollups only need to add components for storing nullifiers on-chain and generating/verifying proofs-of-burn to support EIP7503-style private transfers. An example of a Layer 2 (L2) chain with plans to integrate EIP-7503 into its infrastructure is [Taiko](https://taiko.xyz/) as described in this Request for Comment (RFC).

![](./images/eip-7503-RFP.webp)
<span class="text-base italic text-center"><a href="https://app.charmverse.io/taiko/request-for-proposal-rfp-track-8186138497093947" target="_blank"> (source)</a><span>

Here, we see that a protocol like Taiko can offer transaction privacy—without making extensive exchanges to its infrastructure—by adopting EIP-7503. This has a key benefit for protocol teams that don't want to build out a full-scale privacy-focused L2 (a là [Aztec v2](https://aztec.network/)) but wish to provide basic untraceability and unlinkability to users. The Nethermind team's [proposal to implement EIP-7503 on Taiko](https://app.charmverse.io/taiko/page-4749893061296133) is worth reading to get an idea of how EIP-7503 can be implemented by an Ethereum L2.

EIP-7503 also balances the need for privacy with regulatory compliance, which aligns with the objective of Ethereum's "privacy 2.0" movement: safeguarding user privacy, whilst ensuring bad actors are unable to exploit privacy infrastructure for nefarious purposes. Per [an implementation of EIP-7503](https://ethresear.ch/t/rfc-eip7503-private-transfers/18664) described on Ethereum Research, rollups that adopt EIP-7503 can prevent a repeat of the Tornado Cash issue by selectively barring known hackers and scammers from laundering funds using private transfers.

To achieve this property, we require users to pass a list of blacklisted addresses (`blacklist[]`) as input to the circuit that generates ZK-SNARK proofs of burn transactions. The circuit checks that the address of the user receiving ETH isn't part of the addresses stored in the blacklist when generating a proof-of-burn—a transfer to a blacklisted address will automatically fail since the circuit cannot generate a proof if the input fails to satisfy all validity conditions.

Maintaining a registry of blacklisted addresses introduces a degree of centralization and potential censorship vectors. But if we accept that community-driven, ground-up self-regulation is better than centralized, top-down regulation, such gadgets to ensure compliance with regulations may be necessary.

## 3. Private payroll management for on-chain organizations
Transparency is one of the cornerstones of DAOs (Decentralized Autonomous Organizations): unlike traditional organizations where details of financial remuneration are concealed from investors and stakeholders, contributor payments in DAOs are publicly recorded on-chain. This on-chain audit trail provides a significant amount of accountability and greatly reduces the information asymmetry that may result in financial mismanagement by DAO administrators.

However, DAOs will inevitably mature and start to operate like corporations (for better or worse)—at which point things like keeping details of contributor compensation private may become desirable. EIP-7503 provides the infrastructure DAOs need to start making private payments to core contributors, developers, and independent contractors. In all cases, the recipient only needs to generate a burn address to receive payments and withdraw to its choice address.

How will DAO members keep administrators accountable if private contributor/contractor payments are implemented? This depends on the level of privacy the DAO is looking for and what level of concealment DAO members can tolerate. For example, to prove that AliceDAO indeed paid out 20 ETH to Alice for DAO work and that money wasn't used for alternative purposes, Alice can provide a proof that shows she generated the unspendable address.

For example, Alice may reveal the private key _**s**_ used to create the unspendable address. Since the unspendable address is nullified after the minting operation, Alice can reveal _**s**_ without incurring any risk. A third-party verifier will derive the unspendable address by hashing _**s**_ using the same cryptographic hash function Alice used initially and compare both addresses. If they match, the verifier knows Alice had access to the burn address at the time the transaction was sent. It doesn't, however, know what address Alice used to receive the minted ETH tokens (preserving Alice's privacy to some extent).

## 4. Reducing dependency on cryptocurrency mixers
Using a mixer like Tornado Cash to break links between wallet addresses is problematic because it creates a form of _guilt-by-association_. Remember that mixers provide anonymity by mixing up funds deposited by different users into a single fund that anyone can withdraw from—without having to provide any other information than evidence to authenticate a historical deposit.

The more funds are deployed into a privacy pool, the harder it is for an external observer to deduce who owns what; if bad actors join the pool, honest participants may be unwittingly assisting criminals to launder money by contributing to the protocol's anonymity set. This is probably why the OFAC sanctions extended (and still extends) to addresses that interacted with Tornado Cash, even if those addresses aren't associated with known bad actors (e.g., phishing gangs, nation state-sponsored hackers, and blackhat exploiters).

Mixers like Tornado Cash also create a problem with fungibility: tokens withdrawn from a mixing pool can become "tainted" and impossible to use or exchange 1:1 with "clean" tokens that haven't passed through a mixer. There's a [great thread on Reddit](https://www.reddit.com/r/ethereum/comments/1av0jex/how_effective_have_the_tornado_cash_ban_been/) that discusses the problem of tainted funds in more detail, which I recommend reading. Here are some of the more enlightening comments from that thread:

![tonado cash ban thread](./images/eip-7503-tonado-cash-ban1.webp)
<span class="text-base italic text-center">Original post<a href="https://www.reddit.com/r/ethereum/comments/1av0jex/how_effective_have_the_tornado_cash_ban_been/" target="_blank"> (source)</a><span>

![tonado cash ban thread](./images/eip-7503-tonado-cash-ban2.webp)
<span class="text-base italic text-center"><a href="https://www.reddit.com/r/ethereum/comments/1av0jex/comment/kr7loc6/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button" target="_blank"> (source)</a><span>

![tonado cash ban thread](./images/eip-7503-tonado-cash-ban3.webp)
<span class="text-base italic text-center"><a href="https://www.reddit.com/r/ethereum/comments/1av0jex/comment/kr8fx1a/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button" target="_blank"> (source)</a><span>

This can have real-world consequences: for example, many high-profile individuals in the Ethereum community [found themselves unable to interact with some dapp frontends](https://cryptoslate.com/defi-protocols-aave-uniswap-balancer-ban-users-following-ofac-sanctions-on-tornado-cash/) after their wallets were sent unsolicited amounts of ETH from the Tornado Cash pool. EIP-7503 is described as a "contractless mixer" and sidesteps the aforementioned problems by using regular EOA-to-EOA transfers to burn ETH and introducing direct minting to facilitate withdrawals from the anonymity pool (vs. using a smart contract).

Another benefit of a contractless mixer is the size of the anonymity set. With Tornado Cash (and similar protocols like [Railgun](https://www.railgun.org/)), the anonymity set is smaller—correlated with the number of participants—and shrinks over time. In contrast, EIP-7503 turns the entire set of _spendable_ and _unspendable_ addresses on Ethereum into an anonymity set. Given the large address-space, it's safe to say on-chain sleuths intent on knowing where the ETH sent to the recipient of a private transfer came from have a tough job ahead of them.

![mem](./images/eip-7503-finding-address-meme.webp)
<span class="text-base italic text-center">Finding Waldo > playing on-chain sleuth.<span>

## Are there drawbacks to implementing EIP-7503?
Some potential drawbacks of implementing EIP-7503:

### 1. Regulatory compliance issues
While previous analyses suggest Ethereum is unlikely to suffer the same fate as Monero and Zcash if it starts supporting private transfers, it's impossible to actually _predict_ what will happen if EIP-7503 is activated. Here's a comment from a participant on the Ethereum Magicians thread discussing the implications for regulators:

![magician thread](./images/eip-7503-tmagician-thread.webp)
<span class="text-base italic text-center"><a href="https://ethereum-magicians.org/t/eip-7503-zero-knowledge-wormholes-private-proof-of-burn-ppob/15456/17" target="_blank"> (source)</a><span>

While a native privacy solution for Ethereum, the community is starting to acknowledge the importance of walking the tightrope between privacy/anonymity and regulatory compliance after the fallout from sanctions targeting Tornado Cash. This idea is particularly influencing the design of a new generation of privacy protocols like [Privacy Pools](https://github.com/ameensol/privacy-pools) and [Nocturne](https://nocturne.xyz/):

* Privacy Pools allows users to generate a "proof of innocence" attesting to the exclusion of their deposit from a pool that stores deposits from bad actors. In other words, a user can interact with a mixer and say "I'm not helping criminals and terrorists launder money."
* Nocturne has plans to transition to a proof-of-innocence protocol, but [currently implements several guardrails to guarantee compliance](https://nocturne-xyz.gitbook.io/nocturne/introduction/compliance#future-roadmap). This includes deposits filtering, delays on deposit processing, per-address rate-limits, and a a global rate-limit that caps the total value of deposits the protocol can process in a day.

Smart contract-based privacy solutions like Nocturne and Privacy Pools are capable of implementing fine-grained controls and selectively excluding users deemed to be engaged in illicit activity. In-protocol privacy solutions like EIP-7503 are undiscriminating—a desirable feature that could, however, create issues and open the door for bad actors to abuse private transactions functionality.

It's (theoretically) possible to improve EIP-7503 by adding the blacklist gadget described previously, but this is likely to open a Pandora's box of problems:

* Who gets to maintain the list of blacklisted addresses? Do we ask OFAC to provide a list of blacklisted addresses and risk having a government deciding who gets to transact privately on Ethereum? Do we risk triggering a contentious fork if a set of validators refuses to censor transfers from one or more accounts listed in the `blacklistedAddresses` registry?

* If EIP-7503 is implemented by a rollup, is the DAO in charge of maintaining the `blacklistedAddresses` registry? Or does the founding team contract the services of forensics companies like Chainalysis, Elliptic, and TRM Labs to provide information about which addresses should be restricted from receiving private transfers? What problems can appear if a for-profit company decides what happens at a rollup's base layer?

* If a rollup decides to remove administrative privileges and make the verifier/minter contracts non-upgradable, how does it ensure bad actors don't start moving funds through the protocol? Can selective filtering of transactions from known exploiters be addressed at upper layers of the stack (e.g., at the sequencer or validator level)? What are the logistics involved?

These are just a few questions that will need to be answered before Ethereum (or Ethereum L2s) adopt EIP-7503. Crypto is still in uncharted waters, but it helps to perform a lot of [Murphyjitsu](https://www.lesswrong.com/tag/murphyjitsu), thinking of potential edge-cases in advance, when making decisions that have significant implications for the protocol's long-term survival.

> Misfortune weighs most heavily on those who expect nothing but good fortune. — Seneca

## 2. Potential centralization associated with ERC-20 tokens
Implementing EIP-7503 requires an upgrade to the EVM to support a new transaction type that accepts a burn receipt and credits the recipient's balance with ETH burned in the previous transaction. Execution clients will also need to upgrade to support a Sparse Merkle Tree (SMT) for storing nullifiers and implement off-chain circuits for generating and verifying proofs-of-burns on behalf of users.

Recognizing that an upgrade may be infeasible, EIP-7503's authors have [an alternative proposal to implement EIP-7503 using an ERC-20 token contract](https://ethresear.ch/t/burnth-wormcash-a-practical-implementation-of-eip-7503-on-ethereum/18875). Users keep the same workflow described in previous sections (sending funds to an unspendable address and generating a nullifier), but mint ERC-20 tokens after submitting a proof-of-burn instead of receiving ETH tokens. The ERC-20 contract integrates with a special EIP-7503 verifier contract that verifies burn proofs on-chain (the ERC-20 contract can implement the verification circuit as well).

While an ERC-20 contract simplifies the implementation of EIP-7503, this approach re-introduces the problem of centralization and censorship. We can make the ERC-20 token non-upgradable and ungovernable like [Wrapped Ether (WETH)](https://etherscan.io/address/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2) to eliminate centralization vectors, but that cannot help with issues like exchanges delisting the token.

Also, we should note that it's easier for on-chain forensics to identify accounts that interact with the ERC-20 contract and place those addresses on a blacklist—if regulators decide to go after more privacy-minded cryptocurrencies circulating on Ethereum. Since this is the problem EIP-7503 was designed to solve, it may be difficult to see how the proposal to create a "private ERC-20 token" is an improvement.

On the flipside, an ERC-20 token will make it easier to implement a transfer screening feature that blocks transfers to blacklisted addresses. A developer could simply store the `blacklist[]` in the contract and modify the `transfer()` to include a check on the identity of the address receiving tokens in the transaction. This is, however, a feature we cannot implement at the protocol level without introducing some very strong trust assumptions.

![implementers meme](./images/eip-7503-implementers-meme.webp)

## 3. Increased R&D overhead
EIP-7503 comes with a requirement to build, test, audit, and maintain complex, cutting-edge cryptographic infrastructure required to support anonymous and private transactions. At least, Nethermind's [description of an L2 implementation of EIP-7503](https://app.charmverse.io/taiko/page-4749893061296133) and Nobitex Labs' [EIP-7503 Chain proof-of-concept](https://github.com/okwme/eip-7503-chain) both suggest a decent amount of engineering effort will go towards creating ZK-SNARK circuits for generating and verifying EIP-7503 proofs.

It's also important to note that cryptographic primitives like ZK-SNARKs are yet to be battle-tested enough for protocol developers to implement them with absolute confidence. To illustrate, Zcash patched a bug that would've permitted a dishonest user to provide fake proofs of asset ownership and [mint an infinite amount of tokens](https://www.coindesk.com/markets/2019/02/05/zcash-team-reveals-it-fixed-a-catastrophic-coin-counterfeiting-bug/amp/) in 2018. I've also discussed the Tornado Cash team's [narrow escape from a potential exploit](https://tornado-cash.medium.com/tornado-cash-got-hacked-by-us-b1e012a3c9a8)in 2019.

A bug in the implementation of EIP-7503 on Ethereum will have a non-trivial impact. For instance, a user that accidentally discovers a flaw that permits bypassing critical checks carried out by the circuit verifying a proof-of-burn (e.g., balance of burn addresses and usage of nullifiers) may exploit the knowledge to mint infinite amounts of Ether and crash the market value of ETH.

Another area of complexity comes from the requirement for the EIP-7503 verifier to verify the block header _**B**_ included in the user-generated proof. The EVM stores hashes of the last 128-256 blocks, so the on-chain verifier cannot trustlessly verify block headers from a longer range.

To verify the state root from older blocks, [EIP-210](https://eips.ethereum.org/EIPS/eip-210) will need to be implemented. EIP-210 proposes to create a system-level smart contract that stores historical block hashes and refactor the `BLOCKHASH` opcode to enable clients to read the contract.

EIP-210 isn't strictly necessary since users have at least one hour (`14 seconds * 256 blocks`) to generate and submit a proof that can be verified with EVM. Still, giving the users freedom to delay redemption of deposits sent to a burn address improves UX and makes the withdrawal process more resistant to address clustering and similar analysis techniques.

An alternative is to integrate an oracle contract that requires (incentivized) actors to submit historical block headers to an on-chain contract. This is easier to implement than creating a system-level smart contract and refactoring an opcode, but requires trusting oracle operators to (a) publish correct block headers (b) submit block headers promptly. If both of these assumptions fail to hold, honest users may be unable to redeem deposits and bad actors could publish incorrect block headers to verify Merkle proofs for non-existent burn transactions.

## 4. Reduction in anonymity sets
At the time EIP-7503 is activated, the anonymity set for a user that mints ETH at block #11000 will include all Ethereum EOAs with a positive ETH balance and zero outgoing transactions. This is crucial to the untraceability property of anonymous transactions: if a transaction burns ETH, it is impossible to recognize it as a burn transaction because an unspendable address looks like a regular Ethereum address.

However, the number of addresses where the account balance remains static and no transactions are sent will reduce to a point where only burn addresses will make up the anonymity set. Thus the anonymity set starts to look like the anonymity sets of contract-based mixers like Tornado Cash and new-generation privacy tools like Privacy Pools and Railgun (implying a gradual reduction in EIP-7503's privacy guarantees).

The only exception are those accounts that receive ETH because the sender accidentally transferred funds to a non-existent address, such accounts will remain in the EIP-7503 anonymity set forever. We may want to consider addresses where the owner loses the private key as part of the anonymity pool, but this (fortunately _and_ unfortunately) happens rarely and those accounts usually have at least one or more outgoing transactions. (It is difficult to imagine the noobiest user losing private keys before making _any_ transaction.)

Notwithstanding reductions in the anonymity set, EIP-7503 is still useful for the plausible deniability it offers. Suppose someone creates a storm on crypto-Twitter and accuses Alice of purposefully burning ETH (by sending to an unspendable address) with the intention to withdraw funds to a new address later. Alice has plausible deniability and can counter the allegation by claiming:

* "I sent ETH to the address by mistake. Can you prove I didn't make a mistake when typing the address in MetaMask?"
* "I have the private key for the address but cannot share it. You wouldn't be asking for my private key now, would you?"
* "I have the private key to the address, but I lost it. Can you prove I didn't lose my private key?"

These claims may fail to convince, but that's what plausible deniability looks like in a real-world context. The [Law Dictionary](https://thelawdictionary.org/article/plausible-deniability/) puts it like this:

> "Plausible doesn't mean trustworthy, possible, or even likely. Plausible means you could conclude that something might or might not be possible. But usually theoretically, superficially, or suspiciously. It doesn't necessarily have to be a "reasonable" conclusion, either. In its broadest sense, the term usually points to a lack of proof. After all, innocent until proven guilty is the backbone of our legal system.

So if there's no proof, it's plausible they could deny it. Essentially anything illegal or unethical that can be explained away under an innocent and probable guise – true or otherwise – falls under plausible deniability. Even if the plausibility of the denial is suspicious."

The only time a user can be conclusively connected to an EIP-7503 private transfer is at the moment of processing a transfer to the recipient address. Users can, however, take steps to reduce or completely eliminate the possibility of external observers connecting the withdrawal transaction to the burn transaction:

* Instead of withdrawing to a spendable address, Alice mints ETH to _another_ burn address to keep funds in the anonymity set. Repeating the burn → mint → burn → mint → repeat process multiple times makes it harder to detect if the final address is an account controlled by Alice.

* Instead of withdrawing the full amount, Alice splits the withdrawal into two or more transactions. Delaying or randomizing withdrawals generates "noise" that encumbers analysis of transaction activity and makes it difficult to link burning and minting transactions to the same user.

**Note**: The second technique is a proposed extension to EIP-7503 and doesn't seem to be feasible with the current design. For users to split withdrawals, a feature for splitting nullifiers such that `nullifier 1` grants the right to mint a fraction of the burn address's balance, `nullifier 2` grants the right to mint another fraction of the balance, etc., is necessary.

## Conclusion
EIP-7503 is a solution to one of Ethereum's most understated problems: a lack of financial privacy. If Ethereum will replace banks one day, it needs to provide a level of privacy equal to what users currently enjoy in the status quo. Anything less, and Ethereum doesn't achieve mass adoption because giving up privacy—even for the benefits of avoiding censorship—is a sacrifice most individuals cannot make.

EIP-7503 is still in the review stage, and will likely undergo changes and performance improvements. Besides future support for withdrawing partial amounts, a useful feature is enabling users to recursively combine multiple proofs of burn into a single SNARK that verifies deposits to different burn addresses in one verification transaction. This feature further enhances the appeal of EIP-7503 for CEXes and merchants that wish to maintain a single address per user deposit without having to submit a proof-of-burn individually for (potentially hundreds or thousands of) burn addresses.

Regular users can also benefit by sending tokens to multiple burn addresses (instead of sending to a single unspendable address) and submitting the aggregate proof and set of nullifiers to complete the private transfer. By using more than one burn address, senders can further randomize transaction activity and stall attempts to backtrack burn transactions to one person. This complements the main benefits that EIP-7503 already provides, such as private self-transfers, private peer-to-peer donations/payments, and private payroll management for on-chain DAOs.

If you've enjoyed reading this article, consider sharing it with someone who may find it informative and subscribe to Ethereum 2077 for more deep dives on proposals coming out of the EIP ecosystem. EIPs For Nerds will continue to focus on privacy solutions in Ethereum, with next week's article being a deep dive on [ERC-5564](https://eips.ethereum.org/EIPS/eip-5564), a standard for generating stealth addresses and sending stealth address transactions on Ethereum.

_**Acknowledgements**: Thanks to the [Lido (LEGO) grants program](https://lido.fi/lego) for providing a grant to support work on this article. [Hamid Bateni](https://github.com/irnb) and [Keyvan Kambakhsh](https://github.com/keyvank) from the EIP-7503 provided great answers to my questions about EIP-7503. I'd also like to acknowledge [Micah Zoltu](https://github.com/MicahZoltu) and the [Nethermind team](https://twitter.com/NethermindEth) for their insights on the more technical aspects of implementing EIP-7503._
