---
title: understanding-blockchain-governance
pubDate: 06/28/2024
author: Fikunmi
authorTwitterHandle: eawosikaa
tags:
  - Governance
imgUrl: '../../assets/Understanding Blockchain Governance.webp'
description: 'Governance in the blockchain'
layout: '../../layouts/BlogPost.astro'
---
The way most of us (including yours truly) think of blockchain governance is naive. We think governance is about deciding what forks the protocol undergoes or on-chain governance, but this is a gross reduction/oversimplification of governance. The formal processes that we often conflate with governance are a very small part of the actual process.

Most blockchain governance happens on Twitter in the form of never-ending waves of psyops from stakeholders looking to coerce (subtly or aggressively) everyone else or at least the majority, to accept their vision as the future of blockchains. It's not immediately obvious that tweeting "eth is the future of the internet" or "restaking is bad" is propaganda and that's why I've written this article—to help you develop a complete mental framework of what blockchain governance is.

I start by explaining why you should care about governance at all, then I explain what it is, how you can participate in it and finish off with identifying key elements of blockchain governance that'll help shape your understanding of politics. Let's get to it.

It's easy to be apathetic about blockchain governance; it seems like the only way to participate–debating EIPs, might be better left to _egghead-gigabrains_like Vitalik or Tim Roughgarden. Whether that be because you don't feel smart enough to contribute (which we'll address later) or because you feel OK delegating the decision making, there are two reasons why **you**should care and participate in blockchain governance:

These two reasons are why I participate in governance and why you should too. It's also important to keep in mind that it won't always be this way; the space will expand and like it or not, there'll be a need for more and more formalization and "permissioning." In essence, as an individual, you currently have the most power you'll ever have over this ecosystem and not doing anything now is missing out on your chance to secure your future and impress your ideals on the world at the same time.

I hope I've managed to light a fire in you on why you should care about blockchain governance. Next, we'll look at what the term "blockchain governance" means.

There are many definitions but Vlad Zamfir did a good job of succinctly encapsulating what governance is. I'm paraphrasing here but Vlad basically says, " _governance is **everything**about decisions that affect stakeholders."_I have "everything" in bold because it's very important to keep in mind. More from Vlad:

> It's also about how they coordinate around decisions and decision-making processes. It includes the establishment, maintenance, and revocation of the _**legitimacy**_of decisions, decision making processes, norms, and other mechanisms for coordination.

In summary, _blockchain governance is everything about how blockchain stakeholders coordinate around the establishment, maintenance, and revocation of the legitimacy of decisions, decision making processes, norms, and other mechanisms for coordination._

" _Legitimate_" here means that a decision, decision making process, or coordination mechanism is _legitimate_if stakeholders (justifiably) act like it is a fact that other stakeholders will accept and/or use that decision, decision-making process, or mechanism for coordination.

The mistake most people make when thinking about governance is that they confuse _legitimacy_with formality. They think Ethereum Improvement Proposals (EIP) are legitimate (and one of the only legitimate ways to participate in governance) because there's formal documentation of EIPs. But the sentiment that everyone should be able to run a node at home as the benchmark for Ethereum decentralization is just as _legitimate_as any EIP without any formalization.

Acknowledging and understanding the difference between formal and informal governance processes is the secret to truly understanding blockchain governance.

* Formal governance typically involves explicit rules, procedures, and structures established by official authorities or governing bodies. In formal governance, there are well-defined laws, regulations, policies, charters, and formal decision-making processes.

* Informal governance is more subtle and has no structure—it's spontaneous, _scrappy, fun, and chaotic,_but it can be just as _legitimate_, if not more _._

Informal governance is important in all governance structures but especially in blockchain governance. Because of the focus on decentralization, formal governance processes usually only serve to ratify what informal governance processes have already decided.

A good example of an informal governance decision is when Ethereum pivoted from a sharding-centric roadmap to a rollup-centric roadmap. There was never a formal vote on this; it was just Vitalik and other researchers convincing community members that this was a switch for the better. The rollups-focused EIPs that crystallized the decision came much after the decision had been made.

Another example is the EIP-3074/ERC-4337/EIP-7702 debacle. 3074 had gone through all the formal processes and was bundled in Pectra. But when this information was made public, ERC-4337 stakeholders let the Ethereum community know that 3074 was not perfectly aligned with Ethereum's abstraction roadmap and after some exchanges on Twitter, Unc. [Vitalik proposed 7702 to replace 3074](https://x.com/lightclients/status/1787913527782420929). Informal governance overturned the decision to implement 3074, which had already gone through the formal governance process.

One final example of an informal governance decision is Bitcoin's transition from currency to store of value. Bitcoin started out as a decentralized P2P currency, but when the technology proved insufficient, instead of embracing radical change, some community members began psyops to convince other stakeholders that Bitcoin was a store of value and never meant to be currency. [This struggle came to a head in 2017 when Bitcoin Cash eventually forked from Bitcoin over disputes over raising block sizes](https://www.ig.com/en/bitcoin-btc/bitcoin-cash-vs-bitcoin). The informal governance decision to switch to a store of value is what led Bitcoin to where it is today.

These three examples seem unrelated but the common thread between all of them is that they were extremely impactful decisions that were made with no formal processes. Some were fast like Vitalik stepping in to propose 7702, others were years of politics like Bitcoin's transition but none of them were formal. In addition, all three of these decisions were ratified on Twitter. And if at any point during the process, there was community revolt (on Twitter) to these decisions, none of them would have sailed through.

These examples show that informal governance is not only real but that it often has more impact than even formal governance. It's probably not a stretch to say that all BIPs combined have not affected Bitcoin as much as the switch from currency to store of value and there was never a formal vote on this. It was just psyop after psyop. Similarly, no single EIP will ever affect Ethereum more than the decision to focus on Layer 2 scaling and there was no vote on this.

And that's the most important understanding I want you to leave with today— in blockchain governance, informal governance is real and it's the most impactful form of governance. The good news is that it also has a lower barrier to entry and if done intentionally, you can make an impact.

There is no formal guidebook and each chain/community has its nuances but in general, the most efficient way to participate in governance is to play politics—signal your preferences and coordinate with other like-minded stakeholders to impress your views on everyone else. That could be via Twitter, In-person meetups, articles encouraging participation in governance, anything! But in general, it boils down to three major things:

While that would be a great place to stop, I want to help you build a mental framework for thinking about governance.

* Core Devs: They're just the developers that develop and maintain an actively used client; they have very little power over the actual chain; think the developers of geth.

* App Devs/Entrepreneurs: Are developers/entrepreneurs that build applications/protocols on or around the blockchain protocol.

* Researchers: Individuals/entities that chart the course of innovation by studying the protocol and positing improvements. Core Devs focus on implementing the work of researchers. For some blockchains (e.g. Ethereum), researchers are distinct from other classes of stakeholders and for others (e.g. Solana), there's a good degree of overlap between researchers and core devs.

* Node Operators: are entities that run full nodes/validating (or mining) nodes.

* Token Holders: Entities that hold the token as an investment.

* Users: people who just want to use the chain. At the moment, there's good overlap between users and token holders but in the future, there'll likely be a good degree of separation between both classes. A good example of users that currently exist are remote workers in third world countries that enjoy the convinience of using blockchains to receive payments. This class of stakeholders are not token holders, they just want to use the chain.

Trademark holders and media are not strictly stakeholders but they also heavily influence governance so I'll mention them as well.

> Trademark holders are the entities that hold the legal rights to the trademarks like the name, website, and logo of the chain. Bitcoin isn't trademarked but Ethereum and Solana are. The Ethereum and Solana foundations hold the trademarks for the respective chains. These entities should be credibly neutral but if there's ever a contentious fork, they will be forced to play a role in deciding what most people consider the canonical chain.

Media publications are an important part of the discussion because of the reasons discussed earlier. Usually, whoever controls the media has a good stranglehold on the governance of the chain.

4. Incentives
Different stakeholders "participate in blockchains" for different reasons; it's important to keep incentives in mind because they strongly influence governance. A great example of this is the Ethereum Minimum Viable Issuance proposal. It was strongly rebutted because of a misalignment in incentives for token holders. There are also social incentives, e.g., core devs and researchers have social incentives to be "aligned."

If you approach governance with these four elements in mind, it's easy to understand and effectively participate.

All acts of governance start with the vision. A stakeholder proposes an idea that they feel moves the blockchain closer to its vision or they redefine that vision entirely. Proposals usually have some incentive for the proposer and the reaction of other stakeholders is also largely driven by incentive.

Take for example the outrage at the [Minimum Viable Issuance](https://x.com/weboftrees/status/1710704461750944190)(MVI) proposal. This proposal aims to improve Ethereum's security (vision), yet it was staunchly rejected by token holders (stakeholders) because it seemed like an attack on their yield (incentives.).

Proposals are usually debated until rough consensus is reached and then moves are made to formalize the proposal and eventually it's implemented.

"Ethereum should also focus on Layer 1 scaling" is a new proposal that's gaining ground and you should interact with it that way. "Ethereum is not ultrasound money" is another proposal and you should interact with it that way.

If you approach governance like this i.e. identifying the vision, how the proposal interacts with it, who the stakeholders are, and their incentives, you have everything you need to effectively participate in governance. So go out and be mercilessly loud about what you think should be legitimized or otherwise:

> **do your best to delegitimize governance decisions, processes, and norms that lead to governance outcomes you want to avoid.**Do your best to prevent the legitimization of decisions, processes, and mechanisms for coordination that lead to the outcomes you want to avoid. **Do your best to legitimize and maintain the legitimacy of decisions, processes, and norms that lead to governance outcomes that you want to bring about.**You can do this from your laptop or your phone. Express your interests! **It's early enough that your committed individual participation can and will have a big impact on the future of the blockchain space.**
