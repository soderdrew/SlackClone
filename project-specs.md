# ChatGenius: Smarter Workplace Communication with AI

## Background and Context
Chat apps, such as Slack, are a foundational element of the modern workplace. If you work remotely, they are the workplace—and even if you work in-person, chat apps enable asynchronous collaboration and integration with other common tools.

But chat apps aren’t perfect. Written text lacks the nuance of voice and facial expressions. Chatting can be less engaging, or even less accurate, with people missing key pieces of information.

ChatGenius tackles this by applying generative AI—not to replace humans but to augment them. It gives the user a professional digital twin, an AI avatar that can represent them while still maintaining a personal touch.

---

## Submission Guidelines
At the end of each week, you’ll be required to submit the following to the GauntletAI Platform:

- A link to the code of the project in GitHub.
- The Brainlift you used in learning to build the application (and anything you used to feed to a model to make building the application better).
- A 5-minute walkthrough showing what you’ve built (and, where relevant, how you’ve built it). The more impressive this is, the better.
- The link to you sharing this project on X, along with interactions on any feedback.

---

## Baseline App (Week 1)
Our first week is spent building the application itself using AI-first principles.

Some topics and techniques have not yet been covered in class, but you are not prevented from using them.

For a baseline reference app, consider Slack—it is the dominant tool in this space, providing excellent UX and integration with a rich ecosystem. For the purposes of developing ChatGenius, here are the core features you should target:

- **Authentication**
- **Real-time messaging**
- **Channel/DM organization**
- **File sharing & search**
- **User presence & status**
- **Thread support**
- **Emoji reactions**

IDEs such as Cursor and other AI tools are all fair game, as well as building on related open-source projects (though double-check that the license is compatible with potential commercial use).

---

## AI Objectives (Week 2)
Once you’ve built the app itself, it’s time to add AI! The high-level goal is an AI avatar that represents users in conversations and meetings. Baseline functionality should include:

- **Given a prompt**, can create and send communication on behalf of the user.
- **Context-aware communication** based on content in Slack.
- **Mirrors the user’s personality**, i.e., “sounds” like them.
- **Responds automatically** to questions from other Slack users.

### Advanced Features to Consider:
- **Voice synthesis**: Deliver messages via synthesized voice.
- **Video synthesis**: Deliver messages via synthesized video or visual avatar.
- **Customization**: Allow users to customize the look and style of their avatar:
  - Match their real appearance (upload voice/pictures/video).
  - Provide other custom options.
- **Gesture/expression generation**: Enable more sophisticated expression by the avatar.

These features are only guidelines—your main goal is to build a great app. Feel free to implement your own ideas!

---

## AI Tools and Techniques
You’ll need to explore prompt engineering, templates, and possibly the basics of RAG or fine-tuning.

- **Prompt Engineering**:
  - Use OpenAI API: LLM output depends heavily on prompt quality. Iterate on prompts for better results.
  - **Prompt Templates** (LangChain): Incorporate real-world information, such as relevant chat messages.

- **Retrieval Augmented Generation (RAG)**:
  - Enhance AI apps by providing access to a large corpus of relevant content without retraining models.
  - [Build a RAG App: Part 1](https://langchain.com) (LangChain).

- **Fine-Tuning**:
  - OpenAI Platform Fine Tuning: Train an LLM to behave more like the data you provide (e.g., user chats).

For advanced visual/video avatars, check out services like [D-ID](https://www.d-id.com) and [HeyGen](https://www.heygen.com). These tools specialize in creating human-like avatars and video content.

We also recommend using an AI observability platform like [Langfuse](https://www.langfuse.com) to monitor and debug your application, as well as gather and label data for future use.

---

## Scope and Deliverables

| **Deliverable**       | **Description**                                                                                                                                       |
|------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Chat app**           | A working chat web app enabling, at minimum, real-time messaging between users in channels. Additional features are welcome!                          |
| **AI augmentation**    | Users can create a virtual avatar that sends chats based on their history.                                                                           |
| **Advanced AI**        | Sophisticated avatars with audio/video, humanized expressions, better context-awareness, and other innovative features.                              |

---

## Milestones

| **Completion Date** | **Project Phase**          | **Description**                                              |
|----------------------|----------------------------|--------------------------------------------------------------|
| Jan 7, 2025         | Chat app MVP              | Working chat app with messaging and channel functionality.  |
| Jan 8, 2025         | Check-in 1                |                                                              |
| Jan 10, 2025        | App complete              | Completed chat app by Friday.                               |
| Jan 13, 2025        | AI Objectives start       |                                                              |
| Jan 15, 2025        | Check-in 2                |                                                              |
| Jan 17, 2025        | AI features complete      | Completed AI objectives by Friday.                         |

---

## Resources
- **[Mattermost](https://mattermost.com)**: An open-source Slack alternative.
- **[LangChain](https://langchain.com)**: A framework for rapid development of AI-powered applications.

---

## Suggested Steps
1. Plan initial approach and set up AI development tools.
2. Get MVP functionality working.
3. Iterate on MVP until it meets baseline feature requirements.
4. Select AI augmentations to implement.
5. Implement AI features, focusing on a runnable MVP for feedback and iteration.

You’re encouraged to share your progress as you go, both for camaraderie and competition. Feel free to ask questions in Slack anytime.
