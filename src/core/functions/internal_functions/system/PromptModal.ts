import {
    ButtonComponent,
    Modal,
    Platform,
    TextAreaComponent,
    TextComponent,
} from "obsidian";
import { TemplaterError } from "utils/Error";

export class PromptModal extends Modal {
    private resolve: (value: string) => void;
    private reject: (reason?: TemplaterError) => void;
    private submitted = false;
    private value: string;

    constructor(
        private prompt_text: string,
        private default_value: string,
        private multi_line: boolean
    ) {
        super(app);
    }

    onOpen(): void {
        this.titleEl.setText(this.prompt_text);
        this.createForm();
    }

    onClose(): void {
        this.contentEl.empty();
        if (!this.submitted) {
            this.reject(new TemplaterError("Cancelled prompt"));
        }
    }

    createForm(): void {
        const div = this.contentEl.createDiv();
        div.addClass("templater-prompt-div");
        let textInput;
        if (this.multi_line) {
            textInput = new TextAreaComponent(div);

            // Add submit button since enter needed for multiline input on mobile
            const buttonDiv = this.contentEl.createDiv();
            buttonDiv.addClass("templater-button-div");
            const submitButton = new ButtonComponent(buttonDiv);
            submitButton.buttonEl.addClass("mod-cta");
            submitButton.setButtonText("Submit").onClick((evt: Event) => {
                this.resolveAndClose(evt);
            });
        } else {
            textInput = new TextComponent(div);
        }

        this.value = this.default_value ?? "";
        textInput.inputEl.addClass("templater-prompt-input");
        textInput.setPlaceholder("Type text here");
        textInput.setValue(this.value);
        textInput.onChange((value) => (this.value = value));
        textInput.inputEl.addEventListener("keydown", (evt: KeyboardEvent) =>
            this.enterCallback(evt)
        );
    }

    private enterCallback(evt: KeyboardEvent) {
        // Fix for Korean inputs https://github.com/SilentVoid13/Templater/issues/1284
        if (evt.isComposing || evt.keyCode === 229) return;

        if (this.multi_line) {
            if (Platform.isDesktop) {
                // eslint-disable-next-line no-empty
                if (evt.shiftKey && evt.key === "Enter") {
                } else if (evt.key === "Enter") {
                    this.resolveAndClose(evt);
                }
            } else {
                // allow pressing enter on mobile for multi-line input
                if (evt.key === "Enter") {
                    evt.preventDefault();
                }
            }
        } else {
            if (evt.key === "Enter") {
                this.resolveAndClose(evt);
            }
        }
    }

    private resolveAndClose(evt: Event | KeyboardEvent) {
        this.submitted = true;
        evt.preventDefault();
        this.resolve(this.value);
        this.close();
    }

    async openAndGetValue(
        resolve: (value: string) => void,
        reject: (reason?: TemplaterError) => void
    ): Promise<void> {
        this.resolve = resolve;
        this.reject = reject;
        this.open();
    }
}
