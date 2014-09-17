<?php
/*
* This file is part of the Sulu CMS.
*
* (c) MASSIVE ART WebServices GmbH
*
* This source file is subject to the MIT license that is bundled
* with this source code in the file LICENSE.
*/

namespace Sulu\Component\Content\Template;

use Exception;
use Sulu\Exception\FeatureNotImplementedException;
use Sulu\Component\Content\Template\Exception\InvalidXmlException;
use Symfony\Component\Config\Loader\LoaderInterface;
use Symfony\Component\Config\Loader\LoaderResolverInterface;
use Symfony\Component\Config\Util\XmlUtils;

/**
 * reads a template xml and returns a array representation
 */
class TemplateReader implements LoaderInterface
{
    /**
     * path to schema
     * @var string
     */
    protected $schemaPath = '/Resources/schema/template/template-1.0.xsd';

    /**
     * tags that are required in template
     * TODO should be possible to inject from config
     * @var array
     */
    protected $requiredTags = array(
        'sulu.node.name'
    );

    /**
     * reserved names for sulu internals
     * TODO should be possible to inject from config
     * @var array
     */
    protected $reservedPropertyNames = array(
        'template',
        'changer',
        'changed',
        'creator',
        'created',
        'published',
        'state',
        'internal',
        'nodeType',
        'navContexts'
    );

    /**
     * xml namespaces
     * @var array
     */
    protected $namespaces = array(
        'x' => 'http://schemas.sulu.io/template/template'
    );

    /**
     * template attributes
     * @var array
     */
    protected $attributes = array(
        'key' => array(
            'xpath' => '/x:template/x:key',
            'mandatory' => true
        ),
        'view' => array(
            'xpath' => '/x:template/x:view',
            'mandatory' => true
        ),
        'controller' => array(
            'xpath' => '/x:template/x:controller',
            'mandatory' => true
        ),
        'cacheLifetime' => array(
            'xpath' => '/x:template/x:cacheLifetime',
            'mandatory' => true
        ),
        'indexName' => array(
            'xpath' => '/x:template/x:index/@name',
            'mandatory' => false
        )
    );

    /**
     * xpath to properties
     * @var string
     */
    protected $propertiesPath = '/x:template/x:properties/x:*';

    /**
     * xpath to meta
     * @var string
     */
    protected $metaPath = '/x:template/x:meta/x:*';

    /**
     * {@inheritdoc}
     */
    public function load($resource, $type = null)
    {
        // init running vars
        // DEEP COPY
        $requiredTags = array_merge(array(), $this->requiredTags);
        $tags = array();

        // read file
        $xmlDocument = XmlUtils::loadFile($resource, __DIR__ . $this->schemaPath);

        // generate xpath for file
        $xpath = new \DOMXPath($xmlDocument);
        foreach ($this->namespaces as $key => $value) {
            $xpath->registerNamespace($key, $value);
        }

        // init result
        $result = $this->loadTemplateAttributes($xpath);

        // load properties
        $result['properties'] = $this->loadProperties($this->propertiesPath, $requiredTags, $tags, $xpath);

        if (sizeof($requiredTags) > 0) {
            throw new InvalidXmlException(
                sprintf(
                    'Tag(s) %s required but not found',
                    join(',', $requiredTags)
                )
            );
        }

        return $result;
    }

    /**
     * load basic template attributes
     */
    private function loadTemplateAttributes(\DOMXPath $xpath)
    {
        $result = array();
        foreach ($this->attributes as $key => $attribute) {
            $value = $this->getValueFromXPath($attribute['xpath'], $xpath);
            if ($value === null && $attribute['mandatory']) {
                throw new InvalidXmlException(sprintf('Mandatory key "%s" not found', $key));
            }

            $result[$key] = $value;
        }

        $result['meta'] =$this->loadMeta($this->metaPath, $xpath);

        // filter null values
        $result = array_filter($result);

        return $result;
    }

    /**
     * load properties from given context
     */
    private function loadProperties($path, &$requiredTags, &$tags, \DOMXPath $xpath, \DOMNode $context = null)
    {
        $result = array();

        /** @var \DOMElement $node */
        foreach ($xpath->query($path, $context) as $node) {
            if ($node->tagName === 'property') {
                $value = $this->loadProperty($xpath, $node, $requiredTags, $tags);
                $result[$value['name']] = $value;
            } elseif ($node->tagName === 'block') {
                $value = $this->loadBlock($xpath, $node, $requiredTags, $tags);
                $result[$value['name']] = $value;
            } elseif ($node->tagName === 'section') {
                $value = $this->loadSection($xpath, $node, $requiredTags, $tags);
                $result[$value['name']] = $value;
            }
        }

        return $result;
    }

    /**
     * load single property
     */
    private function loadProperty(\DOMXPath $xpath, \DOMNode $node, &$requiredTags, &$tags)
    {
        $result = $this->loadValues(
            $xpath,
            $node,
            array('name', 'type', 'minOccurs', 'maxOccurs', 'colspan', 'cssClass')
        );

        if (in_array($result['name'], $this->reservedPropertyNames)) {
            throw new InvalidXmlException(
                sprintf('Property name %s is a reserved name', $result['name'])
            );
        }

        $result['indexField'] = $xpath->query('x:indexField', $node)->length ? true : false;
        $result['mandatory'] = $this->getBooleanValueFromXPath('@mandatory', $xpath, $node, false);
        $result['multilingual'] = $this->getBooleanValueFromXPath('@multilingual', $xpath, $node, true);
        $result['tags'] = $this->loadTags('x:tag', $requiredTags, $tags, $xpath, $node);
        $result['params'] = $this->loadParams('x:params/x:param', $xpath, $node);
        $result['meta'] = $this->loadMeta('x:meta/x:*', $xpath, $node);

        return $result;
    }

    /**
     * load single block
     */
    private function loadBlock(\DOMXPath $xpath, \DOMNode $node, &$requiredTags, &$tags)
    {
        $result = $this->loadValues(
            $xpath,
            $node,
            array('name', 'default-type', 'minOccurs', 'maxOccurs', 'colspan', 'cssClass')
        );

        $result['mandatory'] = $this->getBooleanValueFromXPath('@mandatory', $xpath, $node, false);
        $result['type'] = 'block';
        $result['tags'] = $this->loadTags('x:tag', $requiredTags, $tags, $xpath, $node);
        $result['params'] = $this->loadParams('x:params/x:param', $xpath, $node);
        $result['meta'] = $this->loadMeta('x:meta/x:*', $xpath, $node);
        $result['types'] = $this->loadTypes('x:types/x:type', $requiredTags, $tags, $xpath, $node);

        return $result;
    }

    /**
     * load single block
     */
    private function loadSection(\DOMXPath $xpath, \DOMNode $node, &$requiredTags, &$tags)
    {
        $result = $this->loadValues(
            $xpath,
            $node,
            array('name', 'colspan', 'cssClass')
        );

        $result['type'] = 'section';
        $result['params'] = $this->loadParams('x:params/x:param', $xpath, $node);
        $result['meta'] = $this->loadMeta('x:meta/x:*', $xpath, $node);
        $result['properties'] = $this->loadProperties('x:properties/x:*', $requiredTags, $tags, $xpath, $node);

        return $result;
    }

    /**
     * load tags from given tag and validates them
     */
    private function loadTags($path, &$requiredTags, &$tags, \DOMXPath $xpath, \DOMNode $context = null)
    {
        $result = array();

        /** @var \DOMElement $node */
        foreach ($xpath->query($path, $context) as $node) {
            $tag = $this->loadTag($xpath, $node);
            $this->validateTag($tag, $requiredTags, $tags);

            $result[] = $tag;
        }

        return $result;
    }

    /**
     * validates a single tag
     */
    private function validateTag($tag, &$requiredTags, &$tags)
    {
        // remove tag from required tags
        $requiredTags = array_diff($requiredTags, array($tag['name']));

        // check for duplicated priority
        if (
            isset($tags[$tag['name']]) &&
            in_array(
                $tag['priority'],
                $tags[$tag['name']]
            )
        ) {
            throw new InvalidXmlException(
                sprintf(
                    'Priority %s of tag %s exists duplicated',
                    $tag['priority'],
                    $tag['name']
                )
            );
        } elseif (!isset($tags[$tag['name']])) {
            $tags[$tag['name']] = array();
        }

        $tags[$tag['name']][] = $tag['priority'];
    }

    /**
     * load single tag
     */
    private function loadTag(\DOMXPath $xpath, \DOMNode $node)
    {
        return $this->loadValues($xpath, $node, array('name', 'priority'));
    }

    /**
     * load params from given node
     */
    private function loadParams($path, \DOMXPath $xpath, \DOMNode $context = null)
    {
        $result = array();

        /** @var \DOMElement $node */
        foreach ($xpath->query($path, $context) as $node) {
            $result[] = $this->loadParam($xpath, $node);
        }

        return $result;
    }

    /**
     * load single param
     */
    private function loadParam(\DOMXPath $xpath, \DOMNode $node)
    {
        return $this->loadValues($xpath, $node, array('name', 'value'));
    }

    /**
     * load types from given node
     */
    private function loadTypes($path, &$requiredTags, &$tags, \DOMXPath $xpath, \DOMNode $context = null)
    {
        $result = array();

        /** @var \DOMElement $node */
        foreach ($xpath->query($path, $context) as $node) {
            $value = $this->loadType($xpath, $node, $requiredTags, $tags);
            $result[$value['name']] = $value;
        }

        return $result;
    }

    /**
     * load single param
     */
    private function loadType(\DOMXPath $xpath, \DOMNode $node, &$requiredTags, &$tags)
    {
        $result = $this->loadValues($xpath, $node, array('name'));

        $result['meta'] = $this->loadMeta('x:meta/x:*', $xpath, $node);
        $result['properties'] = $this->loadProperties('x:properties/x:*', $requiredTags, $tags, $xpath, $node);

        return $result;
    }

    private function loadMeta($path, \DOMXPath $xpath, \DOMNode $context = null)
    {
        $result = array();

        /** @var \DOMElement $node */
        foreach ($xpath->query($path, $context) as $node) {
            $attribute = $node->tagName;
            $lang = $this->getValueFromXPath('@lang', $xpath, $node);

            if (!isset($result[$node->tagName])) {
                $result[$attribute] = array();
            }
            $result[$attribute][$lang] = $node->textContent;
        }

        return $result;
    }

    /**
     * load values defined by key from given node
     */
    private function loadValues(\DOMXPath $xpath, \DOMNode $node, $keys, $prefix = '@')
    {
        $result = array();

        foreach ($keys as $key) {
            $result[$key] = $this->getValueFromXPath($prefix . $key, $xpath, $node);
        }

        return $result;
    }

    /**
     * returns boolean value of path
     */
    private function getBooleanValueFromXPath($path, \DOMXPath $xpath, \DomNode $context = null, $default = null)
    {
        if (($value = $this->getValueFromXPath($path, $xpath, $context)) != null) {
            return $value === 'true' ? true : false;
        } else {
            return $default;
        }
    }

    /**
     * returns value of path
     */
    private function getValueFromXPath($path, \DOMXPath $xpath, \DomNode $context = null, $default = null)
    {
        try {
            $result = $xpath->query($path, $context);
            if ($result->length === 0) {
                return $default;
            }

            $item = $result->item(0);
            if ($item === null) {
                return $default;
            }

            return $item->nodeValue;
        } catch (Exception $ex) {
            return $default;
        }
    }

    /**
     * {@inheritdoc}
     */
    public function supports($resource, $type = null)
    {
        return is_string($resource) && 'xml' === pathinfo($resource, PATHINFO_EXTENSION);
    }

    /**
     * {@inheritdoc}
     */
    public function getResolver()
    {
        throw new FeatureNotImplementedException();
    }

    /**
     * {@inheritdoc}
     */
    public function setResolver(LoaderResolverInterface $resolver)
    {
        throw new FeatureNotImplementedException();
    }
}
