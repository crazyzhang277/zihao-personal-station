import "../main";
import { aboutContent } from "../data/content";

const bioEl = document.getElementById("about-bio");
const interestList = document.getElementById("interest-list");
const contactList = document.getElementById("contact-list");
const quoteEl = document.getElementById("about-quote");

if (bioEl) bioEl.textContent = aboutContent.bio;
if (quoteEl) quoteEl.textContent = aboutContent.statement;

if (interestList) {
  interestList.innerHTML = aboutContent.interests
    .map((interest) => `<li>${interest}</li>`)
    .join("");
}

if (contactList) {
  contactList.innerHTML = aboutContent.contacts
    .map((contact) => {
      const value = contact.href
        ? `<a href="${contact.href}" target="_blank" rel="noreferrer">${contact.value}</a>`
        : `<strong>${contact.value}</strong>`;
      return `<li><span>${contact.label}</span>${value}</li>`;
    })
    .join("");
}