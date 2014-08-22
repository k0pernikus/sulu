<?php
/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Sulu\Component\Content;

use DateTime;
use Sulu\Component\Content\StructureExtension\StructureExtensionInterface;
use Symfony\Component\PropertyAccess\Exception\NoSuchPropertyException;

/**
 * Structure for template
 */
interface StructureInterface extends \JsonSerializable
{
    const STATE_TEST = 1;
    const STATE_PUBLISHED = 2;

    /**
     * @param string $language
     */
    public function setLanguageCode($language);

    /**
     * returns language of node
     * @return string
     */
    public function getLanguageCode();

    /**
     * @param string $webspace
     */
    public function setWebspaceKey($webspace);

    /**
     * returns webspace of node
     * @return string
     */
    public function getWebspaceKey();

    /**
     * id of node
     * @return int
     */
    public function getUuid();

    /**
     * sets id of node
     * @param $uuid
     */
    public function setUuid($uuid);

    /**
     * returns absolute path of node
     * @return string
     */
    public function getPath();

    /**
     * @param string $path
     */
    public function setPath($path);
    /**
     * returns id of creator
     * @return int
     */
    public function getCreator();

    /**
     * sets user id of creator
     * @param $userId int id of creator
     */
    public function setCreator($userId);

    /**
     * returns user id of changer
     * @return int
     */
    public function getChanger();

    /**
     * sets user id of changer
     * @param $userId int id of changer
     */
    public function setChanger($userId);

    /**
     * return created datetime
     * @return DateTime
     */
    public function getCreated();

    /**
     * sets created datetime
     * @param DateTime $created
     */
    public function setCreated(DateTime $created);

    /**
     * returns changed DateTime
     * @return DateTime
     */
    public function getChanged();

    /**
     * sets changed datetime
     * @param DateTime $changed
     */
    public function setChanged(DateTime $changed);

    /**
     * key of template definition
     * @return string
     */
    public function getKey();

    /**
     * twig template of template definition
     * @return string
     */
    public function getView();

    /**
     * controller which renders the template definition
     * @return string
     */
    public function getController();

    /**
     * cacheLifeTime of template definition
     * @return int
     */
    public function getCacheLifeTime();

    /**
     * @return string
     */
    public function getOriginTemplate();

    /**
     * @param string $originTemplate
     */
    public function setOriginTemplate($originTemplate);

    /**
     * returns a property instance with given name
     * @param $name string name of property
     * @return PropertyInterface
     * @throws NoSuchPropertyException
     */
    public function getProperty($name);

    /**
     * checks if a property exists
     * @param string $name
     * @return boolean
     */
    public function hasProperty($name);

    /**
     * returns an array of properties
     * @param bool $flatten
     * @return PropertyInterface[]
     */
    public function getProperties($flatten = false);

    /**
     * @param boolean $hasChildren
     */
    public function setHasChildren($hasChildren);

    /**
     * returns true if node has children
     * @return boolean
     */
    public function getHasChildren();

    /**
     * @param StructureInterface[] $children
     */
    public function setChildren($children);

    /**
     * returns children array
     * @return StructureInterface[]
     */
    public function getChildren();

    /**
     * @param int $state
     * @return int
     */
    public function setNodeState($state);

    /**
     * returns state of node
     * @return int
     */
    public function getNodeState();

    /**
     * returns true if state of site is "published"
     * @return boolean
     */
    public function getPublishedState();

    /**
     * @param int $globalState
     * @deprecated deprecated since version 0.6.3 -> to be removed with version 0.7.0
     */
    public function setGlobalState($globalState);

    /**
     * returns global state of node (with inheritance)
     * @return int
     */
    public function getGlobalState();

    /**
     * @param \DateTime $published
     */
    public function setPublished($published);

    /**
     * returns first published date
     * @return \DateTime
     */
    public function getPublished();

    /**
     * return value of property with given name
     * @param $name string name of property
     * @return mixed
     */
    public function getPropertyValue($name);

    /**
     * returns all property names
     * @return array
     */
    public function getPropertyNames();

    /**
     * @param \Sulu\Component\Content\StructureType $type
     */
    public function setType($type);

    /**
     * return type of structure
     * @return \Sulu\Component\Content\StructureType
     */
    public function getType();

    /**
     * returns true if this node is shown in navigation
     * @return string[]
     */
    public function getNavContexts();

    /**
     * @param string[] $navContexts
     */
    public function setNavContexts($navContexts);

    /**
     * @param boolean $hasTranslation
     */
    public function setHasTranslation($hasTranslation);

    /**
     * return true if structure translation is valid
     * @return boolean
     */
    public function getHasTranslation();

    /**
     * returns an array of property value pairs
     * @param bool $complete True if result should be representation of full node
     * @param int $layer
     * @return array
     */
    public function toArray($complete = true, $layer = 1);

    /**
     * returns a property instance with given tag name
     * @param string $tagName
     * @param $highest
     * @return PropertyInterface
     */
    public function getPropertyByTagName($tagName, $highest = true);

    /**
     * returns properties with given tag name sorted by priority
     * @param string $tagName
     * @throws \Symfony\Component\PropertyAccess\Exception\NoSuchPropertyException
     * @return PropertyInterface[]
     */
    public function getPropertiesByTagName($tagName);

    /**
     * returns value of property with given tag name
     * @param string $tagName
     * @return mixed
     */
    public function getPropertyValueByTagName($tagName);

    /**
     * indicates tag exists
     * @param string $tag
     * @return bool
     */
    public function hasTag($tag);

    /**
     * @return StructureExtensionInterface[]
     */
    public function getExt();

    /**
     * @param $data
     * @return array
     */
    public function setExt($data);

    /**
     * @return int
     */
    public function getNodeType();

    /**
     * @param int $nodeType
     */
    public function setNodeType($nodeType);

    /**
     * @return boolean
     */
    public function getInternal();

    /**
     * @param boolean $internal
     */
    public function setInternal($internal);

    /**
     * returns resourcelocator addicted to the type
     * @return string
     */
    public function getResourceLocator();

    /**
     * returns node name addicted to the type
     * @return string
     */
    public function getNodeName();

    /**
     * returns content node that holds the internal link
     * @return StructureInterface
     */
    public function getInternalLinkContent();

    /**
     * set content node that holds the internal link
     * @param StructureInterface $internalLinkContent
     */
    public function setInternalLinkContent($internalLinkContent);

    /**
     * returns title of property
     * @param string $languageCode
     * @return string
     */
    public function getLocalizedTitle($languageCode);
}
