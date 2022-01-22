//
// Copyright (C) Microsoft. All rights reserved.
//
define(['lib/knockout', 'oobesettings-data', 'legacy/bridge', 'legacy/events', 'legacy/core'], (ko, oobeSettingsData, bridge, constants, core) => {
    class OobeAadcAgeConfirmationViewModel {
        constructor(resourceStrings, targetPersonality, isInternetAvailable) {
            this.resourceStrings = resourceStrings;
            this.targetPersonality = targetPersonality;
            this.isInternetAvailable = isInternetAvailable;
            this.viewName = ko.observable("defaults");
            this.learnMoreContent = "";
            this.selectedItemValue = "";

            let titleTextStrings = {};
            let subHeaderTextStrings = {};
            titleTextStrings["defaults"] = resourceStrings.Title;
            subHeaderTextStrings["defaults"] = resourceStrings.Subtitle;
            titleTextStrings["learnmore"] = resourceStrings.LearnMoreTitle;
            subHeaderTextStrings["learnmore"] = "";

            this.title = ko.pureComputed(() => {
                return titleTextStrings[this.viewName()];
            });
            this.subHeaderText = ko.pureComputed(() => {
                return subHeaderTextStrings[this.viewName()];
            })

            this.items = [
                {
                    value: false,
                    icon: resourceStrings.Option1Glyph,
                    valueText: resourceStrings.Option1Header,
                    descriptionText: resourceStrings.Option1Text
                },
                {
                    value: true,
                    icon: resourceStrings.Option2Glyph,
                    valueText: resourceStrings.Option2Header,
                    descriptionText: resourceStrings.Option2Text
                }
            ];
            this.selectedItem = ko.observable();
            this.selectedItem.subscribe((item) => {
                this.optionSelectedFlag(true);
                this.selectedItemValue = item.value;
            });

            this.optionSelectedFlag = ko.observable(false);
            this.processingFlag = ko.observable(false); // guards against further interactions until steady state is reached

            let flexEndButtonSet = {};
            flexEndButtonSet["defaults"] = [
                {
                    buttonText: resourceStrings.LearnMoreButtonText,
                    buttonType: "button",
                    automationId: "AadcAgeConfirmationLearnMoreButton",
                    isPrimaryButton: false,
                    autoFocus: false,
                    disableControl: ko.pureComputed(() => {
                        return this.processingFlag();
                    }),
                    buttonClickHandler: () => {
                        this.onLearnMore();
                    }
                },
                {
                    buttonText: resourceStrings.NextButtonText,
                    buttonType: "button",
                    automationId: "AadcAgeConfirmationNextButton",
                    isPrimaryButton: true,
                    autoFocus: true,
                    disableControl: ko.pureComputed(() => {
                        return (!this.optionSelectedFlag() || this.processingFlag());
                    }),
                    buttonClickHandler: () => {
                        this.onNext();
                    }
                }
            ];
            flexEndButtonSet["learnmore"] = [
                {
                    buttonText: "Continue",
                    buttonType: "button",
                    automationId: "AadcAgeConfirmationContinueButton",
                    isPrimaryButton: true,
                    autoFocus: false,
                    disableControl: ko.pureComputed(() => {
                        return this.processingFlag();
                    }),
                    buttonClickHandler: () => {
                        this.onLearnMoreContinue();
                    }
                }
            ];

            this.flexEndButtons = ko.pureComputed(() => {
                return flexEndButtonSet[this.viewName()];
            });
            this.learnMoreVisible = ko.pureComputed(() => {
                return (this.viewName() === "learnmore");
            });

            this.viewName.subscribe((newViewName) => {
                if (newViewName === "defaults") {
                    // Reenable button interaction if we're back on the 'defaults' page. 'learnmore' will
                    // get its buttons enabled after the iframe is shown after oobeSettingsData.showLearnMoreContent()
                    this.processingFlag(false);
                }
            });
        }

        onLearnMore() {
            if (!this.processingFlag()) {
                this.processingFlag(true);
                bridge.invoke("CloudExperienceHost.Telemetry.logUserInteractionEvent", "LearnMoreButtonClicked");
                this.viewName("learnmore");
                this.showLearnMore();
                KoHelpers.setFocusOnAutofocusElement();
            }
        }

        showLearnMore() {
            let learnMoreIFrame = document.getElementById("learnMoreIFrame");
            let doc = learnMoreIFrame.contentWindow.document;
            let msaInformationPage = "https://go.microsoft.com/fwlink/?linkid=2162068";
            oobeSettingsData.showLearnMoreContent(doc, msaInformationPage, document.documentElement.dir, this.isInternetAvailable, this.resourceStrings.NavigationError, this.targetPersonality);
            this.processingFlag(false);
        }

        onNext() {
            if (!this.processingFlag()) {
                this.processingFlag(true);
                bridge.invoke("CloudExperienceHost.Telemetry.logUserInteractionEvent", "NextButtonClicked");
                if (this.selectedItemValue == true) {
                    bridge.fireEvent(constants.Events.done, constants.AppResult.success);
                }
                else {
                    bridge.fireEvent(constants.Events.done, constants.AppResult.cancel);
                }
            }
        }

        onLearnMoreContinue() {
            if (!this.processingFlag()) {
                this.processingFlag(true);
                bridge.invoke("CloudExperienceHost.Telemetry.logUserInteractionEvent", "LearnMoreContinueButtonClicked");
                this.viewName("defaults");
                KoHelpers.setFocusOnAutofocusElement();
            }
        }
    }
    return { OobeAadcAgeConfirmationViewModel };
});
