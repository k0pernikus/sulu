<?php

namespace Sulu\Bundle\ContactBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * EmailType
 */
class EmailType
{
    /**
     * @var string
     */
    private $name;

    /**
     * @var integer
     */
    private $id;

    /**
     * @var \Doctrine\Common\Collections\Collection
     */
    private $emails;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->emails = new \Doctrine\Common\Collections\ArrayCollection();
    }
    
    /**
     * Set name
     *
     * @param string $name
     * @return EmailType
     */
    public function setName($name)
    {
        $this->name = $name;
    
        return $this;
    }

    /**
     * Get name
     *
     * @return string 
     */
    public function getName()
    {
        return $this->name;
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
     * Add emails
     *
     * @param \Sulu\Bundle\ContactBundle\Entity\Email $emails
     * @return EmailType
     */
    public function addEmail(\Sulu\Bundle\ContactBundle\Entity\Email $emails)
    {
        $this->emails[] = $emails;
    
        return $this;
    }

    /**
     * Remove emails
     *
     * @param \Sulu\Bundle\ContactBundle\Entity\Email $emails
     */
    public function removeEmail(\Sulu\Bundle\ContactBundle\Entity\Email $emails)
    {
        $this->emails->removeElement($emails);
    }

    /**
     * Get emails
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getEmails()
    {
        return $this->emails;
    }
}
