---
title: Rethinking My Career After Reading "Software Development and the Concrete vs. the Abstract"
date: 2026-08-29
lang: en
description: After reading a book on software development and the concrete vs. the abstract, I thought about my future career and the skills I should build
---

## About the book

This book is written by Isao Hosoya, who has authored many books on the theme of "the concrete and the abstract", and here he discusses that theme in the context of software development.

https://gihyo.jp/book/2026/978-4-297-15790-6

Within the IT industry, it focuses in particular on the structure and problems of the SI (systems integration) business.

That said, the cases it describes are not unique to SI. I think the same patterns can show up at product companies that build software in-house.

## What stayed with me

The core message of the book is: "don't stop at the concrete — carry the abstract perspective too."

I don't work as an engineer in the SI industry, but I still found a lot I could use.

Below are the parts that stayed with me the most.

### Present something concrete to make a decision possible

The argument starts from a familiar scene: you ask "what do you want for lunch?", get "anything is fine", and then when you propose something concrete (e.g. beef bowl) you hear "hmm, maybe not that."

The claim here is that humans are bad at judging the abstract (e.g. "what do you want for lunch?") but good at judging the concrete (e.g. "is beef bowl okay for lunch?").

Agile development is what puts this human trait to work. Agile doesn't ask for perfection from the start. You build something small and concrete, ask for feedback, fold that feedback back in, and keep the loop turning. Because people are good at judging whether a concrete thing is good or bad, development can move quickly.

I'm working in an agile process right now, and yet I had never put "why agile works" into words this clearly. Reading this section deepened my understanding of why agile is effective.

### Why does the user's perspective matter?

Not only in SI but in every industry, you're told at every turn to "think from the user's perspective."

I always thought "well, of course — thinking from the user's perspective matters", but I had never thought hard about *why* it matters.

So why does it matter? Because thinking about the user's perspective (the abstract) reveals more possible means (the concrete).

Suppose a user asks you for something specific, like "make this button blue."

Someone living in the world of the concrete takes that at face value and makes the button blue.

That isn't wrong, of course. But someone living in the world of the abstract thinks one level up: "why does this user want the button to be blue?" Then the user's real goal comes into view — "I want the button to be easier to see and easier to press." Once you see that, you can propose other, better options (e.g. make the button bigger, move it somewhere else). That is the payoff of thinking from the user's perspective.

### Who survives in the age of AI?

The book puts it this way:

> What AI is best at is the process of making a defined problem concrete (the How).

> What disappears in the age of AI is not job titles. It is "the part where you think you are thinking, but are really just processing the concrete you were handed."

In other words, what disappears in the age of AI is not a particular job title. What disappears is the "merely processing the concrete" part that exists in every job. (Of course, if a job consists entirely of processing the concrete, then that job itself will disappear.)

So what should we do? The book says:

> What will be asked of us is not the ability to grind through the concrete, but the ability to abstract, to find problems, and to design structure.

> The ability to make a customer's request concrete — that is a downstream strength. But the ability to step back one notch and ask "what should we be aiming for in the first place?" and "what is the problem we actually need to solve?" is the entrance to the upstream.

In short, what matters is sharpening the skills AI is weak at: extracting problems and abstracting them.

## Thinking about my career and the skills to build

Having read this book, I thought about my own career and the skills I should build.

This is a personal take from someone working as an SRE, so it won't apply to everyone.

Please read it as one data point.

The first thing to keep in mind is that AI will keep taking over the concrete. That trend seems certain to me. That is, AI will take on the concrete part of problem solving (the How).

But even though the concrete gets taken over, it won't all go at once. What goes first, I think, is the "mediocre concrete." The "high-level concrete" will stick around for a while. That matches what I feel on the ground.

And even when the concrete is taken over, concrete skills don't become entirely unnecessary. However much abstract work increases, the job of "giving concrete instructions" remains. You can't give AI precise instructions if you don't understand the technology at all.

So keeping concrete skills growing is still a must. Even so, the concrete skills we've had so far won't be enough. We need to acquire abstract skills and shift more of our weight onto them.

### Skills I want to sharpen

With that in mind, here are the skills I want to invest in:

- Low layer (high-level concrete skills)
    - OS, networking, Linux, and so on
- High layer (abstract skills)
    - System architecture, product management, and so on
- Observability (the skill that connects the abstract and the concrete)

For high-level concrete skills, I especially want to sharpen the low-layer areas. Partly it's simply a field I find interesting, and partly because once you have the high-level concrete of the low layer, the concrete of the layers above becomes easy to pick up. Low-layer knowledge also pays off when going deeper into observability, which I discuss next.

For abstract skills, I want to sharpen system architecture and product management. Simply put, these are the areas AI has the hardest time replacing.

On top of those (high layer and low layer), I want to build "observability" as an additional specialty.

If we're heading into an era where many people define the abstract and hand the concrete to AI, then I think demand will rise for the layer that connects the abstract and the concrete — observability. Imagine a product where engineers think through the Why and hand the How, the implementation, entirely to AI. Because it's left to AI, the engineers naturally don't know the details of the implementation (the concrete). What happens when a system failure hits in that situation? I can picture them stuck, unable to identify the cause.

"Just have the AI read the implementation" isn't the answer either. Runtime facts — actual traffic, latency, how things break — aren't written in the code to begin with. And the faster AI makes development, the more services and changes there are, so the set of things you can only learn by observing keeps growing.

Observability is what fills that gap. By raising observability, you can compensate for an engineer's resolution on the system even when parts of the concrete are out of view.

That's why I want to sharpen my observability skills.

### The concrete career

So what career am I actually aiming for?

Personally, I'm not drawn to a way of working like IT consulting or the upstream phases at an SIer, where you handle only the abstract and hand the concrete to someone else.

In the situations I've been part of, the more people you put in between, the slower the "build it, ship it, fix it" loop becomes.

And the speed of that loop matters even more in the age of AI. As AI takes on the building, the bottleneck moves to the side that judges "is this good enough?" If that's true, a structure where more people sit in between and judgments take longer to travel simply becomes a slower loop.

For now, I want to be at a company that builds its own product, in a position where I can work on both the high layer and the low layer, in an environment where I can create original products with speed.

On top of that (since people management doesn't motivate me much), I want to aim for senior technical roles such as tech lead or staff engineer.

### Starting with the everyday work

I've gotten into specifics about career, but what I want to start with is changing how I approach the work in front of me.

When I'm handed a request, I want to build the habit of thinking at a more abstract layer: "why?", "what is this for?", "is it even necessary? is there another way?" In short, ask the Why before jumping to the How.

I want to put what I learned from this book to use, sharpen my abstraction skills, and become an engineer who can survive the age of AI.
