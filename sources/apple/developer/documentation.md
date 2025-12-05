---
title: Prompt
url: 'https://developer.apple.com/documentation/foundationmodels/prompt'
capturedAt: '2025-12-05T17:05:03.922Z'
breadcrumb:
  - Developer
  - Documentation
version: iOS 26.0
language: swift
source: apple
---
## [Mentioned in](/documentation/foundationmodels/prompt#mentions)

[

Generating content and performing tasks with Foundation Models](/documentation/foundationmodels/generating-content-and-performing-tasks-with-foundation-models)[

Prompting an on-device foundation model](/documentation/foundationmodels/prompting-an-on-device-foundation-model)

## [Overview](/documentation/foundationmodels/prompt#overview)

Prompts can contain content written by you, an outside source, or input directly from people using your app. You can initialize a `Prompt` from a string literal:

```swift
let prompt = Prompt("What are miniature schnauzers known for?")

```

Use [`PromptBuilder`](/documentation/foundationmodels/promptbuilder) to dynamically control the prompt’s content based on your app’s state. The code below shows that if the Boolean is `true`, the prompt includes a second line of text:

```swift
let responseShouldRhyme = true
let prompt = Prompt {
    "Answer the following question from the user: \(userInput)"
    if responseShouldRhyme {
        "Your response MUST rhyme!"
    }
}

```

If your prompt includes input from people, consider wrapping the input in a string template with your own prompt to better steer the model’s response. For more information on handling inputs in your prompts, see [Improving the safety of generative model output](/documentation/foundationmodels/improving-the-safety-of-generative-model-output).

All input to the model contributes tokens to the context window of the [`LanguageModelSession`](/documentation/foundationmodels/languagemodelsession) — including the [`Instructions`](/documentation/foundationmodels/instructions), [`Prompt`](/documentation/foundationmodels/prompt), [`Tool`](/documentation/foundationmodels/tool), and [`Generable`](/documentation/foundationmodels/generable) types, and the model’s responses. If your session exceeds the available context size, it throws [`LanguageModelSession.GenerationError.exceededContextWindowSize(_:)`](/documentation/foundationmodels/languagemodelsession/generationerror/exceededcontextwindowsize\(_:\)).

Prompts can consume a lot of tokens, especially when you send multiple prompts to the same session. To reduce your prompt size when you exceed the context window size:

-   Write shorter prompts to save tokens.
    
-   Provide only the information necessary to perform the task.
    
-   Use concise and imperative language instead of indirect or jargon that the model might misinterpret.
    
-   Use a clear verb that tells the model what to do, like “Generate”, “List”, or “Summarize”.
    
-   Include the target response length you want, like “In three sentences” or “List five reasons”.
    

Prompting the same session eventually leads to exceeding the context window size. When that happens, create a new context window by initializing a new instance of [`LanguageModelSession`](/documentation/foundationmodels/languagemodelsession). For more information on managing the context window size, see [TN3193: Managing the on-device foundation model’s context window](/documentation/Technotes/tn3193-managing-the-on-device-foundation-model-s-context-window).

## [Topics](/documentation/foundationmodels/prompt#topics)

### [Creating a prompt](/documentation/foundationmodels/prompt#Creating-a-prompt)

[`init(_:)`](/documentation/foundationmodels/prompt/init\(_:\))[`struct PromptBuilder`](/documentation/foundationmodels/promptbuilder)A type that represents a prompt builder.[`protocol PromptRepresentable`](/documentation/foundationmodels/promptrepresentable)A type whose value can represent a prompt.

## [Relationships](/documentation/foundationmodels/prompt#relationships)

### [Conforms To](/documentation/foundationmodels/prompt#conforms-to)

-   [`Copyable`](/documentation/Swift/Copyable)
-   [`PromptRepresentable`](/documentation/foundationmodels/promptrepresentable)
-   [`Sendable`](/documentation/Swift/Sendable)
-   [`SendableMetatype`](/documentation/Swift/SendableMetatype)

## [See Also](/documentation/foundationmodels/prompt#see-also)

### [Prompting](/documentation/foundationmodels/prompt#Prompting)

[

Prompting an on-device foundation model](/documentation/foundationmodels/prompting-an-on-device-foundation-model)Tailor your prompts to get effective results from an on-device model.[`class LanguageModelSession`](/documentation/foundationmodels/languagemodelsession)An object that represents a session that interacts with a language model.[`struct Instructions`](/documentation/foundationmodels/instructions)Details you provide that define the model’s intended behavior on prompts.[`struct Transcript`](/documentation/foundationmodels/transcript)A linear history of entries that reflect an interaction with a session.[`struct GenerationOptions`](/documentation/foundationmodels/generationoptions)Options that control how the model generates its response to a prompt.
