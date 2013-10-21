<?php
/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Sulu\Bundle\ContactBundle\Controller;

use DateTime;
use FOS\RestBundle\Routing\ClassResourceInterface;
use Sulu\Bundle\ContactBundle\Entity\Account;
use Sulu\Bundle\ContactBundle\Entity\Contact;
use Sulu\Bundle\ContactBundle\Entity\Email;
use Sulu\Bundle\ContactBundle\Entity\Phone;
use Sulu\Bundle\ContactBundle\Entity\Address;
use Sulu\Bundle\ContactBundle\Entity\Note;
use Sulu\Component\Rest\Exception\EntityNotFoundException;
use Sulu\Component\Rest\Exception\RestException;
use Sulu\Component\Rest\RestController;

/**
 * Makes contacts available through a REST API
 * @package Sulu\Bundle\ContactBundle\Controller
 */
class ContactsController extends RestController implements ClassResourceInterface
{
    protected $entityName = 'SuluContactBundle:Contact';

    /**
     * Lists all the contacts or filters the contacts by parameters
     * Special function for lists
     * route /contacts/list
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function listAction()
    {
        $view = $this->responseList();

        return $this->handleView($view);
    }

    /**
     * Deletes a Contact with the given ID from database
     * @param int $id
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function deleteAction($id)
    {
        $delete = function ($id) {
            /** @var Contact $contact */
            $entityName = 'SuluContactBundle:Contact';
            $contact = $this->getDoctrine()
                ->getRepository($entityName)
                ->findById($id);

            if (!$contact) {
                throw new EntityNotFoundException($entityName, $id);
            }

            $em = $this->getDoctrine()->getManager();
            $addresses = $contact->getAddresses()->toArray();
            /** @var Address $address */
            foreach ($addresses as $address) {
                if ($address->getAccounts()->count() == 0 && $address->getContacts()->count() == 1) {
                    $em->remove($address);
                }
            }
            $phones = $contact->getPhones()->toArray();
            /** @var Phone $phone */
            foreach ($phones as $phone) {
                if ($phone->getAccounts()->count() == 0 && $phone->getContacts()->count() == 1) {
                    $em->remove($phone);
                }
            }
            $emails = $contact->getEmails()->toArray();
            /** @var Email $email */
            foreach ($emails as $email) {
                if ($email->getAccounts()->count() == 0 && $email->getContacts()->count() == 1) {
                    $em->remove($email);
                }
            }

            $em->remove($contact);
            $em->flush();
        };

        $view = $this->responseDelete($id, $delete);

        return $this->handleView($view);
    }

    /**
     * Shows the contact with the given Id
     * @param $id
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function getAction($id)
    {
        $view = $this->responseGetById(
            $id,
            function ($id) {
                return $this->getDoctrine()
                    ->getRepository('SuluContactBundle:Contact')
                    ->findById($id);
            }
        );

        return $this->handleView($view);
    }

    /**
     * Creates a new contact
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function postAction()
    {
        $firstName = $this->getRequest()->get('firstName');
        $lastName = $this->getRequest()->get('lastName');

        try {
            if ($firstName == null) {
                throw new RestException('There is no first name for the contact');
            }
            if ($lastName == null) {
                throw new RestException('There is no last name for the contact');
            }

            $em = $this->getDoctrine()->getManager();

            // Standard contact fields
            $contact = new Contact();
            $contact->setFirstName($firstName);
            $contact->setLastName($lastName);

            $contact->setTitle($this->getRequest()->get('title'));
            $contact->setPosition($this->getRequest()->get('position'));

            $parentData = $this->getRequest()->get('account');
            if ($parentData != null && $parentData['id'] != null) {
                /** @var Account $parent */
                $parent = $this->getDoctrine()
                    ->getRepository('SuluContactBundle:Account')
                    ->findAccountById($parentData['id']);

                if (!$parent) {
                    throw new EntityNotFoundException('SuluContactBundle:Account', $parentData['id']);
                }
                $contact->setAccount($parent);
            }

            $contact->setCreated(new DateTime());
            $contact->setChanged(new DateTime());

            $emails = $this->getRequest()->get('emails');
            if (!empty($emails)) {
                foreach ($emails as $emailData) {
                    $this->addEmail($contact, $emailData);
                }
            }

            $phones = $this->getRequest()->get('phones');
            if (!empty($phones)) {
                foreach ($phones as $phoneData) {
                    $this->addPhone($contact, $phoneData);
                }
            }

            $addresses = $this->getRequest()->get('addresses');
            if (!empty($addresses)) {
                foreach ($addresses as $addressData) {
                    $this->addAddress($contact, $addressData);
                }
            }

            $notes = $this->getRequest()->get('notes');
            if (!empty($notes)) {
                foreach ($notes as $noteData) {
                    $this->addNote($contact, $noteData);
                }
            }

            $em->persist($contact);

            $em->flush();

            $view = $this->view($contact, 200);
        } catch (EntityNotFoundException $enfe) {
            $view = $this->view($enfe->toArray(), 404);
        } catch (RestException $re) {
            $view = $this->view($re->toArray(), 400);
        }

        return $this->handleView($view);
    }

    public function putAction($id)
    {
        $contactEntity = 'SuluContactBundle:Contact';

        try {
            /** @var Contact $contact */
            $contact = $this->getDoctrine()
                ->getRepository($contactEntity)
                ->findById($id);

            if (!$contact) {
                throw new EntityNotFoundException($contactEntity, $id);
            } else {

                $em = $this->getDoctrine()->getManager();

                // Standard contact fields
                $contact->setFirstName($this->getRequest()->get('firstName'));
                $contact->setLastName($this->getRequest()->get('lastName'));

                $contact->setTitle($this->getRequest()->get('title'));
                $contact->setPosition($this->getRequest()->get('position'));

                $parentData = $this->getRequest()->get('account');
                if ($parentData != null && $parentData['id'] != null) {
                    /** @var Account $parent */
                    $parent = $this->getDoctrine()
                        ->getRepository('SuluContactBundle:Account')
                        ->findAccountById($parentData['id']);

                    if (!$parent) {
                        throw new EntityNotFoundException('SuluContactBundle:Account', $parentData['id']);
                    }
                    $contact->setAccount($parent);
                }

                $contact->setChanged(new DateTime());

                // process details
                if (!($this->processEmails($contact)
                    && $this->processPhones($contact)
                    && $this->processAddresses($contact)
                    && $this->processNotes($contact))
                ) {
                    throw new RestException('Updating dependencies is not possible', 0);
                }

                $em->flush();
                $view = $this->view($contact, 200);
            }
        } catch (EntityNotFoundException $exc) {
            $view = $this->view($exc->toArray(), 404);
        } catch (RestException $exc) {
            $view = $this->view($exc->toArray(), 400);
        }

        return $this->handleView($view);
    }

    /**
     * Process all emails from request
     * @param Contact $contact The contact on which is worked
     * @return bool True if the processing was successful, otherwise false
     */
    protected function processEmails(Contact $contact)
    {
        $emails = $this->getRequest()->get('emails');

        $delete = function ($email) use ($contact) {
            return $contact->removeEmail($email);
        };

        $update = function ($email, $matchedEntry) {
            return $this->updateEmail($email, $matchedEntry);
        };

        $add = function ($email) use ($contact) {
            return $this->addEmail($contact, $email);
        };

        return $this->processPut($contact->getEmails(), $emails, $delete, $update, $add);
    }

    /**
     * Adds a new email to the given contact and persist it with the given object manager
     * @param Contact $contact
     * @param $emailData
     * @return bool True if there was no error, otherwise false
     */
    protected function addEmail(Contact $contact, $emailData)
    {
        $success = true;
        $em = $this->getDoctrine()->getManager();

        $emailType = $this->getDoctrine()
            ->getRepository('SuluContactBundle:EmailType')
            ->find($emailData['emailType']['id']);

        if (!$emailType || isset($emailData['id'])) {
            $success = false;
        } else {
            $email = new Email();
            $email->setEmail($emailData['email']);
            $email->setEmailType($emailType);
            $em->persist($email);
            $contact->addEmail($email);
        }

        return $success;
    }

    /**
     * Updates the given email address
     * @param Email $email The email object to update
     * @param array $entry The entry with the new data
     * @return bool True if successful, otherwise false
     */
    protected function updateEmail(Email $email, $entry)
    {
        $success = true;

        $emailType = $this->getDoctrine()
            ->getRepository('SuluContactBundle:EmailType')
            ->find($entry['emailType']['id']);

        if (!$emailType) {
            $success = false;
        } else {
            $email->setEmail($entry['email']);
            $email->setEmailType($emailType);
        }

        return $success;
    }

    /**
     * Process all phones from request
     * @param Contact $contact The contact on which is worked
     * @return bool True if the processing was successful, otherwise false
     */
    protected function processPhones(Contact $contact)
    {
        $phones = $this->getRequest()->get('phones');

        $delete = function ($phone) use ($contact) {
            return $contact->removePhone($phone);
        };

        $update = function ($phone, $matchedEntry) {
            return $this->updatePhone($phone, $matchedEntry);
        };

        $add = function ($phone) use ($contact) {
            return $this->addPhone($contact, $phone);
        };

        return $this->processPut($contact->getPhones(), $phones, $delete, $update, $add);
    }

    /**
     * Add a new phone to the given contact and persist it with the given object manager
     * @param Contact $contact
     * @param $phoneData
     * @return bool True if there was no error, otherwise false
     */
    protected function addPhone(Contact $contact, $phoneData)
    {
        $success = true;
        $em = $this->getDoctrine()->getManager();

        $phoneType = $this->getDoctrine()
            ->getRepository('SuluContactBundle:PhoneType')
            ->find($phoneData['phoneType']['id']);

        if (!$phoneType || isset($phoneData['id'])) {
            $success = false;
        } else {
            $phone = new Phone();
            $phone->setPhone($phoneData['phone']);
            $phone->setPhoneType($phoneType);
            $em->persist($phone);
            $contact->addPhone($phone);
        }

        return $success;
    }


    /**
     * Updates the given phone
     * @param Phone $phone The phone object to update
     * @param $entry The entry with the new data
     * @return bool True if successful, otherwise false
     */
    protected function updatePhone(Phone $phone, $entry)
    {
        $success = true;

        $phoneType = $this->getDoctrine()
            ->getRepository('SuluContactBundle:PhoneType')
            ->find($entry['phoneType']['id']);

        if (!$phoneType) {
            $success = false;
        } else {
            $phone->setPhone($entry['phone']);
            $phone->setPhoneType($phoneType);
        }

        return $success;
    }

    /**
     * Process all addresses from request
     * @param Contact $contact The contact on which is worked
     * @return bool True if the processing was sucessful, otherwise false
     */
    protected function processAddresses(Contact $contact)
    {
        $addresses = $this->getRequest()->get('addresses');

        $delete = function ($address) use ($contact) {
            return $contact->removeAddresse($address);
        };

        $update = function ($address, $matchedEntry) {
            return $this->updateAddress($address, $matchedEntry);
        };

        $add = function ($address) use ($contact) {
            return $this->addAddress($contact, $address);
        };

        return $this->processPut($contact->getAddresses(), $addresses, $delete, $update, $add);
    }

    /**
     * Add a new address to the given contact and persist it with the given object manager
     * @param Contact $contact
     * @param $addressData
     * @return bool True if there was no error, otherwise false
     */
    protected function addAddress(Contact $contact, $addressData)
    {
        $success = true;
        $em = $this->getDoctrine()->getManager();

        $addressType = $this->getDoctrine()
            ->getRepository('SuluContactBundle:AddressType')
            ->find($addressData['addressType']['id']);

        $country = $this->getDoctrine()
            ->getRepository('SuluContactBundle:Country')
            ->find($addressData['country']['id']);

        if (!$addressType || !$country) {
            $success = false;
        } else {
            $address = new Address();
            $address->setStreet($addressData['street']);
            $address->setNumber($addressData['number']);
            $address->setZip($addressData['zip']);
            $address->setCity($addressData['city']);
            $address->setState($addressData['state']);
            $address->setCountry($country);
            $address->setAddressType($addressType);

            // add additional fields
            if (isset($addressData['addition'])) {
                $address->setAddition($addressData['addition']);
            }

            $em->persist($address);
            $contact->addAddresse($address);
        }

        return $success;
    }

    /**
     * Updates the given address
     * @param Address $address The phone object to update
     * @param array $entry The entry with the new data
     * @return bool True if successful, otherwise false
     */
    protected function updateAddress(Address $address, $entry)
    {
        $success = true;

        $addressType = $this->getDoctrine()
            ->getRepository('SuluContactBundle:AddressType')
            ->find($entry['addressType']['id']);

        $country = $this->getDoctrine()
            ->getRepository('SuluContactBundle:Country')
            ->find($entry['country']['id']);

        if (!$addressType || !$country) {
            $success = false;
        } else {
            $address->setStreet($entry['street']);
            $address->setNumber($entry['number']);
            $address->setZip($entry['zip']);
            $address->setCity($entry['city']);
            $address->setState($entry['state']);
            $address->setCountry($country);
            $address->setAddressType($addressType);

            if (isset($entry['addition'])) {
                $address->setAddition($entry['addition']);
            }
        }

        return $success;
    }

    /**
     * Process all notes from request
     * @param Contact $contact The contact on which is worked
     * @return bool True if the processing was successful, otherwise false
     */
    protected function processNotes(Contact $contact)
    {
        $notes = $this->getRequest()->get('notes');

        $delete = function ($note) use ($contact) {
            return $contact->removeNote($note);
        };

        $update = function ($note, $matchedEntry) {
            return $this->updateNote($note, $matchedEntry);
        };

        $add = function ($note) use ($contact) {
            return $this->addNote($contact, $note);
        };

        return $this->processPut($contact->getNotes(), $notes, $delete, $update, $add);
    }

    /**
     * Add a new note to the given contact and persist it with the given object manager
     * @param Contact $contact
     * @param $noteData
     * @return bool True if there was no error, otherwise false
     */
    protected function addNote(Contact $contact, $noteData)
    {
        $success = true;
        $em = $this->getDoctrine()->getManager();

        $note = new Note();
        $note->setValue($noteData['value']);

        $em->persist($note);
        $contact->addNote($note);

        return $success;
    }

    /**
     * Updates the given note
     * @param Note $note
     * @param array $entry The entry with the new data
     * @return bool True if successful, otherwise false
     */
    protected function updateNote(Note $note, $entry)
    {
        $success = true;

        $note->setValue($entry['value']);

        return $success;
    }
}
