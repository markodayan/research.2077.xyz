---
title: eips-for-nerds-6-erc-5564-and-erc
pubDate: 06/28/2024
author: Ethereum2077, Koray Akpinar
tags:
  - Defi
imgUrl: '../../assets/EIPs For Nerds  6- ERC-5564 & ERC-6538- Stealth Addresses.webp'
layout: '../../layouts/BlogPost.astro'
---
In response to the growing demand for transaction privacy on public ledgers, Ethereum has seen the proposal of ERC-5564 and ERC-6538, which aim to introduce _stealth addresses_to enhance user privacy.

Officially proposed on August 13, 2022, for ERC-5564, and January 24, 2023, for ERC-6538, these enhancements represent pivotal steps toward securing private transactions without altering Ethereum's core protocol. ERC-5564, known as the Stealth Address Protocol (SAP), and ERC-6538, titled Stealth Meta-Address Registry, can be explored in detail through their respective proposals, available at [ERC-5564](https://eips.ethereum.org/EIPS/eip-5564#motivation)and [ERC-6538](https://eips.ethereum.org/EIPS/eip-6538).

Many users naively expect to maintain anonymity by relying on the permissionless nature of cryptographic addresses. But at their core, blockchains are designed to operate openly—the entire history of transactions is publicly available for anyone to see. This means, for example, that anyone sufficiently advanced can scan through the history of an address and make informed guesses about the owner of said address. In addition, the amounts being transferred and the destination of all transactions are also publicly accessible.

It is this problem that led to the birth of Monero (_circa_. April 2014) and ZCash (_circa_2016). Unlike Ethereum and Bitcoin, Monero and Zcash offer privacy at the protocol level through various methods like stealth addresses, ring signatures, and zero-knowledge proofs (ZKPs).

Ethereum (and Bitcoin) still do not provide such privacy features at the protocol level today. Instead, users seeking financial privacy must use protocols like [TornadoCash](https://ipfs.io/ipns/tornadocash.eth/)that enable private transfers on Ethereum.

While these privacy protocols work well for native ETH and well-known ERC20 tokens, they often lack support for NFTs and lesser known ERC20 tokens. In addition, on TornadoCash, you cannot freely adjust the number of tokens you wish to transfer. Instead you have to choose one of 4 numbers: 0.1, 1, 10, 100. Plus, it is important to note that the anonymity offered by each value is different.

Enshrining _stealth addresses_offers a much better user experience for individuals that want to transact privately on Ethereum.

ERC-5564 is a new proposal that brings stealth addresses to Ethereum and unlocks new opportunities to build privacy-preserving financial infrastructure and payment rails on Ethereum. Unlike other proposals like [EIP-7503](https://eips.ethereum.org/EIPS/eip-7503)(which we covered in [EIPs for Nerds #5: EIP-7503](https://ethereum2077.substack.com/p/eip-7503-zero-knowledge-wormholes)), ERC-5564 doesn't require changes to the core Ethereum protocol and can be implemented at the application layer.

ERC-5564 proposes a modular stealth address protocol (SAP) that notably improves on previous approaches to stealth addresses and offers implementers more flexibility—all of which make it the ideal solution for improving financial privacy on Ethereum. This article will provide an in-depth overview of ERC-5564 (Stealth Addresses) and ERC-6358 (Stealth Meta-Address Registry).

Specifically, we'll:

* Explore the history of stealth address protocols,
* Trace the evolution of stealth addresses—to see how previous designs influenced ERC-5564,
* And analyze the advantages and (potential) limitations of ERC-5564 and ERC-6358.

The simplest and perhaps the first instance of stealth addresses appears in a BitcoinTalk forum post from 2011:

In this post, a user under the username ByteCoin voices his dissatisfaction with the traceability of Bitcoin transactions. To address this, he proposes an innovative adaptation of the [Diffie-Hellman Key Exchange](https://apfikunmi.medium.com/are-crypto-wallets-really-secure-675d5d26e720), a method traditionally used to securely exchange cryptographic keys over a public channel.

This adaptation would allow for the creation of stealth addresses. These addresses enhance privacy by enabling a sender to generate a unique, mostly one-time address for each transaction recipient, effectively masking the recipient's true identity on the public ledger.

Before delving into the specifics of the Basic Stealth Address Protocol (BSAP), the world's first stealth address protocol originally proposed by ByteCoin, it's crucial to understand the foundational keypair generation process. Here's a brief refresher to ensure a smooth transition into the mechanics and significance of BSAP:

Bitcoin (and Ethereum) use the _**Secp256k1**_curve and _ [Elliptic Curve Cryptography](https://medium.com/@apfikunmi/are-crypto-wallets-really-secure-675d5d26e720)_to create [keypairs](https://www.ibm.com/docs/en/i/7.3?topic=concepts-public-private-key-pair). This curve's parameters (a, b, and p) and the generator point (G) are public information(as you can see in [here](https://en.bitcoin.it/wiki/Secp256k1)).

Anyone can generate a valid keypair with this information.

* First, the user selects a 256-bit private key, _k_from the generator sub-group. It is advisable to use a Cryptographically Secure Pseudorandom Number Generator (CSPRNG) to obtain this key. However, any 256-bit number in the subgroup will suffice.

* Next, the user derives the public key _(K)_by _**elliptic curve multiplication**_(ecMUL) of the generator point G, k number of times.

Mathematically, the private key _k_, the public key _K,_and the generator point _G,_are related by the expression:

With this understanding in place, we can look at the implementation of ByteCoin's proposal.

Suppose Bob wants to transfer tokens to Alice, but they wish to do so anonymously. Both Bob and Alice have their key pairs:

* **Alice:**(a, A) where _**A = a . G**_and,
* **Bob:**(b, B) where _**B = b . G**_

BSAP proposes accomplishing the anonymous transfer by:

First, having Bob and Alice _independently_create a **shared secret**. They achieve this by multiplying their private keys with the other's public key and hashing the result.

**For Alice:**

**For Bob:**

Since _ecMULs_are _commutativ_e, meaning the order of multiplication does not change the result (i.e., A × B = B × A), Alice and Bob will always arrive at the same _shared secret_, even though they are independently computed. Importantly, only Alice and Bob can compute this _shared secret_by each using their private key with the other's public key, thereby ensuring the privacy and security of their interaction.

This _shared secret_becomes the private key for the stealth address. The corresponding public key is derived as usual.

Bob now sends his payment to this stealth address.

Alice, on her end, does the following:

* Multiplies her private key with Bob's public key,
* Hashes the result to find the _shared secret_
* and multiplies the result by the base point (G) to generate the same stealth address between them.

After completing the previous steps, Alice can check if the payment has arrived and, if desired, use the _shared secre_t (which doubles as the private key) to transfer the funds to her own wallet or elsewhere.

The BSAP is extremely effective but it comes with it's own set of challenges, the primary of which are:

Displeased with the deficiencies of BSAP, Nicolas Van Saberhagen (pseudonym), creator of Monero ([and potential candidate for ByteCoin](https://www.reddit.com/r/Monero/comments/lz2e5v/going_deep_in_the_cryptonote_rabbit_hole_who_was/)), proposed a solution in his 2013 [CryptoNote Whitepaper](https://bytecoin.org/old/whitepaper.pdf). Nicolas essentially uses the same algorithm as BSAP but introduces one key difference: a new keypair called an _ephemeral keypair_is included to prevent the stealth address from remaining constant and to shift control away from the sender. We examine this approach to creating stealth addresses in the next section.

We'll keep with the same example where Bob needs to transfer some tokens to Alice to explain how the Improved Stealth Address Protocol (ISAP) works. As mentioned, the ISAP bears similarity to BSAP—except for the addition of an ephemeral keypair to the stealth address creation process. The protocol is described below:

Alice has a keypair (_a_, _A_) and Bob has a keypair (_b_, _B_). Unlike the previous method:

* Bob (the sender) first creates an ephemeral keypair **(r,R ∋ R = r . G**) and then performs an _ecMUL_of Alice's public key and the ephemeral private key to generate a _shared secret_.

* Alice (who knows the ephemeral public key) can also compute the same _shared secret_by multiplying her private key with the _ephemeral keypair's_public key.

The use of the _ephemeral keypair_for creation of the _shared secret_permits the creation of a different stealth address for every transfer. To derive the public key of the stealth address, Bob incorporates Alice's public key into the equation when deriving the stealth address:

This way, Bob effectively generates a new stealth address for the next transfer between himself and Alice. You may notice the subtle beauty here: multiplying the _shared secret_by G (base point) through elliptic curve multiplication gives you a point on the Curve, which essentially is the Public Key of the _shared secret_. On the other hand, thanks to mathematics and Elliptic Curve Cryptography, after encapsulating the expression within the G (base point) parentheses and simplifying, we find the Private Key:

Note that:

As the final operation shows, the only way to find the Private Key corresponding to the address Bob sent is by knowing Alice's Private Key. This eliminates the control Bob had over the sent assets in previous methods, meaning that now only Alice can control the sent assets.

With ISAP, Nicolas Van Saberhagen improved on the design of BSAP and offered a more usable protocol. However, this new method of generating and using stealth addresses has drawbacks:

* It significantly increases the risk of exposing the private key due to its potential overuse.

* To find transfers made to a wallet's stealth address using this method, one unfortunately needs to know the main wallet's private key, thus only the owners of the main wallet can ideally control the stealth transfers.

The aforementioned issues significantly limited the practical usability of this method. To resolve the problem, a pseudonymous developer known as rynomster/sdcoin developed a new protocol called ShadowSend. ShadowSend closely resembles ISAP,but uses multiple keypairs and was thus named the "Dual-Key Stealth Address Protocol."

The Dual-Key Stealth Address Protocol (DKSAP) doesn't fundamentally alter or add much to Nicolas's Improved Stealth Address Protocol (ISAP).

As mentioned earlier, the significant change it introduces is the division of responsibilities into two distinct keypairs: one for viewing the stealth address (view keypair, V = v . G) and another for spending the assets transferred to the stealth address (spend keypair, S = s . G), instead of managing everything with a single keypair.

This not only addresses the private key overuse issue, thereby reducing the risk of exposure—but it also allows you to delegate the tracking of the stealth address without relinquishing control of your funds. Let's continue with the example of Alice and Bob to illustrate how DKSAP works (remember, Bob is trying to send money to Alice without compromising her identity).

The stealth address generation process remains the same. However, Alice now has two keypairs: a view key and a spend key; both keys can be represented in mathematical notation as described below:

* **View key** _**V = v . G**_, where _v_is view private key
* **Spend key** _**S = s . G**_, where _s_is spend private key

Below is a brief description of how Bob makes stealth payments to Alice using DKSAP:

* To send funds to Alice's wallet, Bob first generates an ephemeral keypair (**E = e . G**). He then uses Alice's view public key and his randomly generated ephemeral private key to create a _shared secret_:

* Next, he multiplies this _shared secret_by the base point (G) to derive a public key. To ensure that only Alice can access the corresponding private key, he adds the _shared secret_public key to Alice's spend public key:

By applying the same mathematical trick as before, we ensure that only Alice can control these funds. Bob can then use this address to send assets to Alice without revealing her identity.

The significant distinction between DKSAP and the previous protocol (ISAP) is the use of the view public key to generate the _shared secret_and the spend public key to compute the stealth address. This setup allows one key to generate and control the _shared secret_, while the other enables possession and management of the funds—essentially, your view keypair maintains privacy, while your spend keypair controls ownership.

To track stealth address transfers, you would need to monitor on-chain transfers for at least a certain period and check all their _shared secrets_. As you can imagine, this can be cumbersome and not very user-friendly. Hence, this protocol allows you to delegate the tracking of transfers made to you, thus eliminating the risk of losing control of your funds. However, care must be taken because the entity performing this task can clearly see to whom each transfer is made, potentially putting your anonymity at risk.

So far, we've discussed various approaches to designing stealth address protocols. While blockchains like Monero have implemented stealth addresses, Ethereum has seen limited use of stealth addresses—with the exception of applications like Umbra Cash. Launched in 2020, Umbra uses the DKSAP and allows users to send stealth payments on Ethereum; since going live, Umbra Cash has facilitated a substantial number of private payments, underscoring the demand for privacy-preserving transactions on Ethereum.

Although Umbra Cash has been a successful experiment, the adoption of stealth addresses in Ethereum is limited due to reasons such as the lack of standardization for generating and interacting with these addresses. ERC-5564 addresses these challenges by standardizing the non-interactive generation of stealth addresses.

This enhancement significantly improves privacy capabilities by enabling transactions where the sender can generate a stealth address using a shared secret known only to them and the recipient. Only the recipient, holding the necessary private key, can access the funds, ensuring that observers cannot link the stealth address back to the recipient's identity.

ERC-5564 introduces the following features:

* A foundational implementation of a single contract compatible with multiple cryptographic schemes, facilitating a centralized location for recipients to monitor incoming transactions without missing any.

* Centralized on-chain storage of stealth meta-addresses, which eliminates the need for users to manually enter platform-specific stealth meta-addresses and simplifies the process for senders to create stealth addresses for their transactions.

In the next section, we'll explore the ERC-5564 specification in more detail

ERC-5564 is a contract standard that utilizes the Dual-Key Stealth Address Protocol (DKSAP) and, optionally, the Improved Stealth Address Protocol (ISAP). This standard allows addresses to store their stealth meta-addresses—comprising both spend and view public keys—on the contract, enabling others to make transfers to them without deciphering their identity. Interestingly, under ERC-5564, you are not necessarily required to split your stealth meta-address into spend and view components; the contract can manage everything with just one key if desired. However, the future use of stealth addresses will likely involve Dual-Key configurations.

A major methodological difference in ERC-5564 from previous standards is the use of a variable called the _view tag_when trying to determine which transfer was made to you. This _view tag_is obtained by selecting the most significant byte after generating the shared secret and is included in the _announcement_event when a transfer is made. For a regular user attempting to decipher which transfer is theirs by manually testing _announcements_, there are typically five operations required:

* 2x ecMUL (Elliptic Curve Multiplication)
* 2x HASH
* 1x ecADD (Elliptic Curve Addition)

With the _view tag_, users only need to perform 1 ecMUL and 1 hash operation to identify the correct transfer, speeding up the parsing (or transfer identification) phase by six times. Even though the use of the _view tag_reveals 1 byte of the _shared secret_, reducing a 128-bit security level to 124 bits, it spares users from having to perform the remaining three operations (ecMUL, HASH, and ecADD) in 255 out of 256 cases. The trade-off of 4 bits only slightly impacts privacy and does not affect the generation of _stealth addresses_.

The implementation of the contract standard is not overly complex, especially compared to other standards, as it primarily consists of a mapping to hold keys, a function to create a stealth address, and an _announcement_event. Let's look at each component:

The creation function, as the name suggests, simply executes the steps of the Dual-Key and Improved Stealth Address Protocols on behalf of Bob, generating a stealth address for him to transfer to Alice.

The _announcement_event in the contract is triggered when a transfer is made to a stealth address. This enables off-chain actors to monitor these _announcements_to check if a transfer has been made to them.

Besides these implementation details, ERC-5564 also introduces a new address format to distinguish stealth addresses from regular addresses:

Here, "shortName" specifies the network on which the stealth address is generated, indicating where the transfer will occur. Even though the cryptographic rules and equations do not change across networks, the possibility for users to arbitrarily change their Stealth Meta-Address based on the network makes it essential to include the network variable in the format. The remaining fields represent the Public Keys, with the first n bytes managing the funds and the subsequent bytes used to verify that you are the intended recipient of the transfer.

Another notable feature of ERC-5564 is its support for multiple Elliptic Curves through schemeIDs. While ERC-5564 primarily supports the popular Secp256k1 Curve, the flexibility to support multiple curves ensures the protocol is future-proof, offering users a choice that enhances the usability and adoption of the protocol.

[ERC-6538](https://eips.ethereum.org/EIPS/eip-6538), while related to stealth addresses, doesn't introduce any logic for creating them; instead, it acts primarily as a registry. This means it facilitates the storage of Stealth Meta-Addresses.

This registry is crucial as it enables senders to access these meta-addresses, allowing them to generate correct stealth addresses for their recipients, ensuring transactions remain both private and correctly directed. Although ERC-5564 already includes a mapping to store keys, ERC-6538 differs by enabling entities to register Stealth Meta-Addresses on behalf of users without on-chain interaction, using only the users' signatures.

In an era where on-chain interactions are often delegated to actors like Bundlers (as in ERC-4337), it's likely not preferable for users to directly register their Stealth Meta-Addresses themselves due to user experience considerations. Thus, the ability to register Stealth Meta-Addresses through signatures is a valuable feature. Clearly, ERC-6538 is not a standalone EIP but rather an extension to ERC-5564, enhancing its functionality.

The adoption of stealth address protocols like ERC-5564 and ERC-6538 is exemplified through real-world implementations such as Nocturne, Railgun, Umbra Cash, and Fluidkey. These applications provide substantial enhancements in privacy, security, and usability on the Ethereum blockchain:

* [Nocturne](https://nocturne.xyz/): This platform leverages stealth addresses to facilitate anonymous transactions, ensuring that user identities remain confidential on public ledgers. By masking the sender and recipient addresses, Nocturne provides robust privacy for its users.

* [Railgun](https://www.railway.xyz/?welcome=1): Railgun stands out by integrating zk-SNARKs with stealth addresses. This combination allows users to hide transaction amounts and sender/recipient addresses, ensuring privacy while maintaining the verifiability of transactions on the blockchain.

* [Umbra Cash](https://app.umbra.cash/): Utilizing the Dual-Key Stealth Address Protocol (DKSAP), Umbra Cash enables users to send ETH and ERC20 tokens privately. It also incorporates off-chain key management to improve user experience and enhance security, making private transactions more accessible. With the [introduction of Umbra v2](https://scopelift.co/blog/introducing-umbra-v2-architectur), the platform aims to further enhance user privacy and scalability, support for more types of assets, and improved user experience with features like stealth addresses for NFTs and minimized transaction fees.

* [Fluidkey](https://www.fluidkey.com/): Fluidkey simplifies the management of stealth addresses by offering a stable ENS for returning stealth addresses and an open-source kit for address recovery and verification. This approach ensures users can maintain their privacy while enjoying the ease of use typical of a standard wallet.

These implementations highlight the practical benefits of stealth address protocols. They provide enhanced privacy, enabling users to conduct transactions without revealing their identities to third-party observers.

Additionally, they address critical user concerns such as the ability to recover addresses if a service goes offline, minimizing transaction fees when dealing with multiple addresses, and ensuring seamless interaction with decentralized applications. By incorporating these features, these platforms demonstrate the potential of ERC-5564 and ERC-6538 to significantly improve the privacy and usability of blockchain transactions.

As outlined, ERC-5564 facilitates private transfers through stealth addresses. These addresses utilize a system where transactions are announced in contracts, and each announcement contains a unique identifier known as a "view tag." Observers can monitor these announcements to detect when a transfer occurs. While this ensures transaction privacy to some extent, it also introduces potential vulnerabilities.

To simplify the monitoring process, users might rely on a centralized entity to manage the "View Keys," which are used to decipher the details of transactions from the view tags. However, this centralization poses significant risks. If such an entity—potentially a major wallet provider like Metamask or Rabby—gains monopolistic control over the View Keys, it could effectively track and index every transaction.

This centralization not only contradicts the principle of decentralization inherent in blockchain technology but also compromises the privacy of stealth addresses, as the entity could observe all transfers between users under its purview.

On the other hand, if you choose not to delegate the responsibility of the View Key, you must personally verify all transfers, a task likely unappealing to most end-users. Moreover, due to the dependency of tests on the number of _announcements_, there's a risk that an adversary could flood the system with thousands of on-chain _announcement_events just to slow you down.

While this might not be a significant issue for digital-only transfers, it could be impractical when making physical purchases using stealth addresses—no one wants to wait 10 minutes at the checkout. As suggested in ERC-5564, implementing various Toll and Staking methods could potentially mitigate such attack vectors.

Another important consideration is that if stealth addresses are used for NFTs or other ERC-20 tokens, these addresses cannot hold native ETH, meaning they cannot conduct transactions. Sending a small amount of ETH to the stealth address from the recipient's own address would completely undermine their anonymity. Thus, the most sensible solution, as stated in ERC-5564, seems to be for the sender to sponsor the transaction by sending a small amount of ETH.

In summary, ERC-5564 and ERC-6538, through the use of DKSAP and ISAP, offer a valuable contribution to Ethereum by enabling transfers to recipients without revealing their identity to third-party observers and without restrictions on the amount or type of assets.

These protocols attempt to bring a level of privacy akin to Monero and Zcash to Ethereum through contract-based solutions for stealth addresses, which are not natively supported at the protocol level. While there are some notable drawbacks, these are expected to be resolved over time.

Thank you for reading this far. I look forward to discussing more in the next edition of EIPs for Nerds.
