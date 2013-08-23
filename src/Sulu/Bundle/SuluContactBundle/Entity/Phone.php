<?php

namespace Sulu\Bundle\ContactBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Phone
 */
class Phone
{
    /**
     * @var integer
     */
    private $id;

    /**
     * @var string
     */
    private $phone;

    /**
     * @var \Sulu\Bundle\ContactBundle\Entity\PhoneType
     */
    private $phoneType;

    /**
     * @var \Doctrine\Common\Collections\Collection
     */
    private $accounts;

    /**
     * @var \Doctrine\Common\Collections\Collection
     */
    private $contacts;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->accounts = new \Doctrine\Common\Collections\ArrayCollection();
        $this->contacts = new \Doctrine\Common\Collections\ArrayCollection();
    }
    
    /**
     * Get id
     *
     * @return integer 
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set phone
     *
     * @param string $phone
     * @return Phone
     */
    public function setPhone($phone)
    {
        $this->phone = $phone;
    
        return $this;
    }

    /**
     * Get phone
     *
     * @return string 
     */
    public function getPhone()
    {
        return $this->phone;
    }

    /**
     * Set phoneType
     *
     * @param \Sulu\Bundle\ContactBundle\Entity\PhoneType $phoneType
     * @return Phone
     */
    public function setPhoneType(\Sulu\Bundle\ContactBundle\Entity\PhoneType $phoneType)
    {
        $this->phoneType = $phoneType;
    
        return $this;
    }

    /**
     * Get phoneType
     *
     * @return \Sulu\Bundle\ContactBundle\Entity\PhoneType 
     */
    public function getPhoneType()
    {
        return $this->phoneType;
    }

    /**
     * Add accounts
     *
     * @param \Sulu\Bundle\ContactBundle\Entity\Account $accounts
     * @return Phone
     */
    public function addAccount(\Sulu\Bundle\ContactBundle\Entity\Account $accounts)
    {
        $this->accounts[] = $accounts;
    
        return $this;
    }

    /**
     * Remove accounts
     *
     * @param \Sulu\Bundle\ContactBundle\Entity\Account $accounts
     */
    public function removeAccount(\Sulu\Bundle\ContactBundle\Entity\Account $accounts)
    {
        $this->accounts->removeElement($accounts);
    }

    /**
     * Get accounts
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getAccounts()
    {
        return $this->accounts;
    }

    /**
     * Add contacts
     *
     * @param \Sulu\Bundle\ContactBundle\Entity\Contact $contacts
     * @return Phone
     */
    public function addContact(\Sulu\Bundle\ContactBundle\Entity\Contact $contacts)
    {
        $this->contacts[] = $contacts;
    
        return $this;
    }

    /**
     * Remove contacts
     *
     * @param \Sulu\Bundle\ContactBundle\Entity\Contact $contacts
     */
    public function removeContact(\Sulu\Bundle\ContactBundle\Entity\Contact $contacts)
    {
        $this->contacts->removeElement($contacts);
    }

    /**
     * Get contacts
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getContacts()
    {
        return $this->contacts;
    }
}